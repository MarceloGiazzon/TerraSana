# Firmware Simulado AgBot (ESP32)

Este diretório contém o código de simulação para o microcontrolador ESP32 usando Wokwi.

## Módulo M04 - Moinho Rotativo

O firmware simula:
- Conexão Wi-Fi
- Conexão MQTT
- Leitura de sensores via Mocks (ADC)
- Publicação de telemetria

### Link para Simulação Wokwi:
[Adicionar Link Aqui]

### Exemplo de código (C++/Arduino):

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* mqtt_server = "broker.emqx.io";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Simulação de leitura do M04
  float current = analogRead(34) * (30.0 / 4095.0); 
  
  String payload = "{\"motor_current\": " + String(current) + "}";
  client.publish("agbot/firmware/m04", payload.c_str());
  delay(2000);
}
```
