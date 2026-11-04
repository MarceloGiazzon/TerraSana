"""Simulador de telemetria do AgBot.

Percorre o terreno em faixas e publica no MQTT uma leitura a cada
PUBLISH_INTERVAL_S segundos. O módulo acoplado troca a cada
MODULE_ROTATION_S segundos (ou fica fixo com ACTIVE_MODULE=M03, por exemplo).
"""

import json
import math
import os
import random
import time

import paho.mqtt.client as mqtt

# Configurações (sobrescrevíveis por variáveis de ambiente)
BROKER = os.getenv("MQTT_BROKER", "broker.emqx.io")
PORT = int(os.getenv("MQTT_PORT", "1883"))
TOPIC = os.getenv("MQTT_TOPIC", "agbot/linha30/telemetry")
PUBLISH_INTERVAL_S = float(os.getenv("PUBLISH_INTERVAL_S", "2"))
MODULE_ROTATION_S = float(os.getenv("MODULE_ROTATION_S", "120"))
FIXED_MODULE = os.getenv("ACTIVE_MODULE", "").upper()

# Limites do terreno (mesmos de data/area.geojson)
FIELD_LAT_MIN = -29.116392
FIELD_LAT_MAX = -29.115946
FIELD_LNG_MIN = -51.227988
FIELD_LNG_MAX = -51.224489
LNG_STEP = 0.00002   # avanço por leitura ao longo da faixa
LAT_STEP = 0.00008   # distância entre faixas


def rand(low, high, digits=1):
    return round(random.uniform(low, high), digits)


def soil_moisture(lat, lng):
    """Umidade com variação espacial suave: a baixada a oeste é mais úmida."""
    x = (lng - FIELD_LNG_MIN) / (FIELD_LNG_MAX - FIELD_LNG_MIN)
    y = (lat - FIELD_LAT_MIN) / (FIELD_LAT_MAX - FIELD_LAT_MIN)
    base = 38 - 10 * x + 4 * math.sin(y * math.pi * 1.5) + 3 * math.cos(x * math.pi * 3)
    return round(base + random.uniform(-1.2, 1.2), 1)


class ModuleState:
    """Contadores que crescem enquanto o módulo trabalha (área roçada, sementes...)."""

    def __init__(self):
        self.reset()

    def reset(self):
        self.area_cut_m2 = 0.0
        self.seeds_planted = 0
        self.hopper_level = 100.0
        self.tank_level = 100.0
        self.applied_l = 0.0
        self.harvested = 0


def m01(state, ctx):
    state.area_cut_m2 += ctx["distance_m"] * 0.45
    return {
        "blade_rpm": int(random.uniform(2850, 3150)),
        "cut_height_mm": 60,
        "blade_current_amp": rand(4.0, 9.0),
        "area_cut_m2": round(state.area_cut_m2, 1),
    }


def m02(state, ctx):
    state.seeds_planted += max(1, int(ctx["distance_m"] / 0.25))
    state.hopper_level = max(0.0, state.hopper_level - 0.08)
    return {
        "seeds_planted": state.seeds_planted,
        "seed_spacing_cm": 25,
        "hopper_level_percent": round(state.hopper_level, 1),
        "fertilizer_g_m": rand(8.0, 12.0),
    }


def m03(state, ctx):
    wet = ctx["moisture"]
    return {
        "nitrogen_mg_kg": rand(20 + wet * 0.3, 32 + wet * 0.3),
        "phosphorus_mg_kg": rand(8.0, 25.0),
        "potassium_mg_kg": rand(80.0, 160.0),
        "ph": rand(5.6, 6.8, 2),
        "probe_depth_cm": 30,
    }


def m04(state, ctx):
    return {
        "motor_current_amp": rand(12.0, 24.5),
        "depth_cm": 8,
        "soil_resistance_index": rand(3.0, 7.5, 2),
    }


def m05(state, ctx):
    flow = rand(0.8, 1.6, 2)
    state.applied_l += flow * PUBLISH_INTERVAL_S / 60
    state.tank_level = max(0.0, 100 - state.applied_l / 20 * 100)
    return {
        "tank_level_percent": round(state.tank_level, 1),
        "flow_lpm": flow,
        "pressure_bar": rand(2.5, 3.2, 2),
        "applied_l": round(state.applied_l, 2),
    }


def m06(state, ctx):
    if random.random() < 0.35:
        state.harvested += 1
    return {
        "harvested_count": state.harvested,
        "grip_force_n": rand(3.0, 6.0),
        "detection_confidence_percent": rand(86.0, 98.0),
        "cycle_time_s": rand(7.0, 11.0),
    }


def m07(state, ctx):
    return {
        "co2_ppm": int(random.uniform(700, 1400)),
        "air_humidity_percent": rand(85.0, 94.0),
        "air_temp_c": rand(17.0, 21.0),
        "fogger_on": random.random() < 0.4,
    }


MODULES = [
    ("M01_ROCADOR", m01),
    ("M02_SEMEADORA", m02),
    ("M03_SOLO_PROFUNDO", m03),
    ("M04_MOINHO_ROTATIVO", m04),
    ("M05_IRRIGADOR", m05),
    ("M06_COLHEITA", m06),
    ("M07_COGUMELOS", m07),
]


def pick_module(started_at):
    if FIXED_MODULE:
        for index, (module_id, _) in enumerate(MODULES):
            if module_id.startswith(FIXED_MODULE):
                return index
    return int((time.time() - started_at) // MODULE_ROTATION_S) % len(MODULES)


def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("Conectado ao Broker MQTT!")
    else:
        print(f"Falha na conexão, código: {reason_code}")


def main():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.connect(BROKER, PORT, 60)
    client.loop_start()

    lat, lng = -29.116169, -51.224500
    lng_dir, lat_dir = -1, 1
    battery = 100.0
    started_at = time.time()
    state = ModuleState()
    current_index = None
    meters_per_lng_deg = 111_320 * math.cos(math.radians(lat))

    print("🛸 Simulador AgBot iniciado... Enviando telemetria.")
    try:
        while True:
            # Percorre o terreno em faixas e inverte o sentido ao chegar às bordas.
            lng += lng_dir * LNG_STEP
            if lng <= FIELD_LNG_MIN or lng >= FIELD_LNG_MAX:
                lng = min(FIELD_LNG_MAX, max(FIELD_LNG_MIN, lng))
                lng_dir *= -1
                next_lat = lat + lat_dir * LAT_STEP
                if next_lat > FIELD_LAT_MAX or next_lat < FIELD_LAT_MIN:
                    lat_dir *= -1
                    next_lat = lat + lat_dir * LAT_STEP
                lat = next_lat

            # Bateria descarrega e volta a 100% ao passar pela doca (simulado).
            battery = battery - 0.02 if battery > 15 else 100.0

            index = pick_module(started_at)
            if index != current_index:
                current_index = index
                state.reset()
            module_id, build = MODULES[index]
            moisture = soil_moisture(lat, lng)
            ctx = {"moisture": moisture, "distance_m": LNG_STEP * meters_per_lng_deg}

            payload = {
                "robot_id": "agbot_prototipo_v1",
                "timestamp": int(time.time()),
                "location": {"latitude": round(lat, 6), "longitude": round(lng, 6), "altitude_m": 750.2},
                "status": {
                    "battery_percent": round(battery, 2),
                    "active_module": module_id,
                    "speed_kmh": rand(1.2, 2.5, 2),
                    "e_stop": False,
                },
                "module_telemetry": build(state, ctx),
                "environmental": {"soil_moisture_percent": moisture, "ambient_temp_c": rand(20.5, 22.5)},
            }

            result = client.publish(TOPIC, json.dumps(payload))
            if result[0] == 0:
                print(f"--> {module_id} · Lat {lat:.6f} · Bateria {battery:.1f}% · Umidade {moisture}%")
            else:
                print(f"Erro ao enviar mensagem para o tópico {TOPIC}")
            time.sleep(PUBLISH_INTERVAL_S)
    except KeyboardInterrupt:
        print("Simulador encerrado.")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
