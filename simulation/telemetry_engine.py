import time
import json
import random
import paho.mqtt.client as mqtt

# Configurações do Broker MQTT
BROKER = "broker.emqx.io"
PORT = 1883
TOPIC = "agbot/linha30/telemetry"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Conectado ao Broker MQTT!")
    else:
        print(f"Falha na conexão, código: {rc}")

client = mqtt.Client()
client.on_connect = on_connect
client.connect(BROKER, PORT, 60)

# Coordenadas base simuladas (Caxias do Sul/RS aproximado conforme prompt)
current_lat = -29.168100
current_lng = -51.179400
battery_soc = 100.0

print("🛸 Simulador AgBot iniciado... Enviando telemetria.")

try:
    while True:
        # Simula o deslocamento do robô em pequenas frações geográficas (zigue-zague simples)
        current_lat += 0.000005 * random.choice([1, 1.1, 0.9, -0.2])
        current_lng += 0.000008 * random.choice([1, 1.05, 0.95, 0.1])
        
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
