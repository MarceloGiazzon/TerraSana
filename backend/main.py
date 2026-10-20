from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import paho.mqtt.client as mqtt
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# MQTT Config
BROKER = "broker.emqx.io"
PORT = 1883
TOPIC = "agbot/linha30/telemetry"

latest_data = {}

def on_message(client, userdata, message):
    global latest_data
    try:
        latest_data = json.loads(message.payload.decode())
    except Exception as e:
        print(f"Error parsing MQTT message: {e}")

mqtt_client = mqtt.Client()
mqtt_client.on_message = on_message
mqtt_client.connect(BROKER, PORT, 60)
mqtt_client.subscribe(TOPIC)
mqtt_client.loop_start()

@app.get("/")
def read_root():
    return {"status": "AgHub API Online"}

@app.get("/telemetry/latest")
def get_latest():
    return latest_data

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            if latest_data:
                await websocket.send_json(latest_data)
            await asyncio.sleep(1)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()
