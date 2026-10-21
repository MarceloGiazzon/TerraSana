import time
import json
import random
import paho.mqtt.client as mqtt

# Configurações do Broker MQTT
BROKER = "broker.emqx.io"
PORT = 1883
TOPIC = "agbot/linha30/telemetry"

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("Conectado ao Broker MQTT!")
    else:
        print(f"Falha na conexão, código: {reason_code}")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.connect(BROKER, PORT, 60)

# Inicia alguns metros dentro do terreno, a partir do acesso pela estrada.
FIELD_LAT_MIN = -29.116392
FIELD_LAT_MAX = -29.115946
FIELD_LNG_MIN = -51.227988
FIELD_LNG_MAX = -51.224489
current_lat = -29.116169
current_lng = -51.224500
longitude_direction = -1
latitude_direction = 1
battery_soc = 100.0

print("🛸 Simulador AgBot iniciado... Enviando telemetria.")

try:
    while True:
        # Percorre o terreno em faixas e inverte o sentido ao chegar às bordas.
        current_lng += longitude_direction * 0.000008
        if current_lng <= FIELD_LNG_MIN or current_lng >= FIELD_LNG_MAX:
            current_lng = min(FIELD_LNG_MAX, max(FIELD_LNG_MIN, current_lng))
            longitude_direction *= -1
            next_lat = current_lat + latitude_direction * 0.00008
            if next_lat > FIELD_LAT_MAX or next_lat < FIELD_LAT_MIN:
                latitude_direction *= -1
                next_lat = current_lat + latitude_direction * 0.00008
            current_lat = next_lat
        
        battery_soc = max(0, battery_soc - 0.005)
        
        payload = {
            "robot_id": "agbot_prototype_v1",
            "timestamp": int(time.time()),
            "location": {
                "latitude": round(current_lat, 6),
                "longitude": round(current_lng, 6),
                "altitude_m": 750.2
            },
            "status": {
                "battery_percent": round(battery_soc, 2),
                "active_module": "M04_ROTARY_TILLER",
                "speed_kmh": round(random.uniform(1.2, 2.5), 2),
                "e_stop": False
            },
            "telemetry_m04": {
                "motor_current_amp": round(random.uniform(12.0, 24.5), 1),
                "depth_cm": 8,
                "soil_resistance_index": round(random.uniform(3.0, 7.5), 2)
            },
            "environmental": {
                "soil_moisture_percent": round(random.uniform(28.0, 42.0), 1),
                "ambient_temp_c": 21.5
            }
        }
        
        result = client.publish(TOPIC, json.dumps(payload))
        status = result[0]
        if status == 0:
            print(f"--> Telemetria enviada: Lat {payload['location']['latitude']}, Bateria: {payload['status']['battery_percent']}%")
        else:
            print(f"Erro ao enviar mensagem para o tópico {TOPIC}")
            
        time.sleep(2)
except KeyboardInterrupt:
    print("Simulador encerrado.")
    client.disconnect()
