import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from typing import Any

import paho.mqtt.client as mqtt
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("agbot.backend")

BROKER = os.getenv("MQTT_BROKER", "broker.emqx.io")
PORT = int(os.getenv("MQTT_PORT", "1883"))
TOPIC = os.getenv("MQTT_TOPIC", "agbot/linha30/telemetry")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

def handle_message(app: FastAPI, payload: dict[str, Any]) -> None:
    app.state.latest_data = payload
    for queue in tuple(app.state.subscribers):
        if queue.full():
            queue.get_nowait()
        queue.put_nowait(payload)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.event_loop = asyncio.get_running_loop()
    app.state.latest_data = None
    app.state.subscribers = set()
    app.state.mqtt_connected = False

    callback_api = getattr(mqtt, "CallbackAPIVersion", None)
    client = mqtt.Client(callback_api.VERSION2) if callback_api else mqtt.Client()

    def on_connect(client, userdata, flags, reason_code, properties=None):
        failed = getattr(reason_code, "is_failure", None)
        connected = not failed if failed is not None else int(reason_code) == 0
        app.state.mqtt_connected = connected
        if connected:
            client.subscribe(TOPIC)
            logger.info("Connected to MQTT broker; subscribed to %s", TOPIC)
        else:
            logger.warning("MQTT connection rejected: %s", reason_code)

    def on_disconnect(client, userdata, disconnect_flags, reason_code=None, properties=None):
        app.state.mqtt_connected = False
        reason = reason_code if reason_code is not None else disconnect_flags
        logger.warning("Disconnected from MQTT broker: %s", reason)

    def on_message(client, userdata, message):
        try:
            payload = json.loads(message.payload.decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("Telemetry payload must be a JSON object")
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as error:
            logger.warning("Ignoring invalid MQTT message: %s", error)
            return

        loop = app.state.event_loop
        if loop.is_running():
            loop.call_soon_threadsafe(handle_message, app, payload)

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    app.state.mqtt_client = client
    client.connect_async(BROKER, PORT, 60)
    client.loop_start()
    logger.info("Starting MQTT client for %s:%s", BROKER, PORT)

    try:
        yield
    finally:
        client.disconnect()
        client.loop_stop()


app = FastAPI(title="AgBot Telemetry API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "AgHub API Online"}

@app.get("/health")
def health():
    return {"status": "ok", "mqtt_connected": app.state.mqtt_connected}

@app.get("/telemetry/latest")
def get_latest():
    return app.state.latest_data or {}

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=1)
    app.state.subscribers.add(queue)
    receive_task = asyncio.create_task(websocket.receive())
    telemetry_task = asyncio.create_task(queue.get())
    try:
        if app.state.latest_data is not None:
            await websocket.send_json(app.state.latest_data)
        while True:
            done, _ = await asyncio.wait(
                (receive_task, telemetry_task),
                return_when=asyncio.FIRST_COMPLETED,
            )
            if receive_task in done:
                message = receive_task.result()
                if message["type"] == "websocket.disconnect":
                    break
                receive_task = asyncio.create_task(websocket.receive())
            if telemetry_task in done:
                await websocket.send_json(telemetry_task.result())
                telemetry_task = asyncio.create_task(queue.get())
    except WebSocketDisconnect:
        pass
    finally:
        for task in (receive_task, telemetry_task):
            if not task.done():
                task.cancel()
        await asyncio.gather(receive_task, telemetry_task, return_exceptions=True)
        app.state.subscribers.discard(queue)
