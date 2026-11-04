// AgBot · Módulo M04 (Moinho Rotativo) — firmware de simulação para ESP32 (Wokwi)
// Lê a corrente do motor (potenciômetro no GPIO34 simula o sensor) e publica
// telemetria em JSON via MQTT, no mesmo formato consumido pelo backend AgHub.

#include <WiFi.h>
#include <PubSubClient.h>

const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";
const char* MQTT_SERVER   = "broker.emqx.io";
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC    = "agbot/linha30/telemetry";

const int   CURRENT_PIN        = 34;     // ADC: sensor de corrente (simulado)
const float CURRENT_FULL_SCALE = 30.0;   // A em 4095
const float STALL_CURRENT_A    = 55.0;   // limite anti-pedra do M04
const unsigned long PUBLISH_MS = 2000;

WiFiClient espClient;
PubSubClient mqtt(espClient);
unsigned long lastPublish = 0;
float batteryPercent = 100.0;

void setupWifi() {
  Serial.printf("Conectando ao Wi-Fi %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print(".");
  }
  Serial.printf("\nWi-Fi conectado. IP: %s\n", WiFi.localIP().toString().c_str());
}

void reconnectMqtt() {
  while (!mqtt.connected()) {
    String clientId = "agbot-m04-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    Serial.print("Conectando ao broker MQTT... ");
    if (mqtt.connect(clientId.c_str())) {
      Serial.println("ok");
    } else {
      Serial.printf("falhou (rc=%d), nova tentativa em 2 s\n", mqtt.state());
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  setupWifi();
  mqtt.setServer(MQTT_SERVER, MQTT_PORT);
  mqtt.setBufferSize(512);
}

void loop() {
  if (!mqtt.connected()) reconnectMqtt();
  mqtt.loop();

  unsigned long now = millis();
  if (now - lastPublish < PUBLISH_MS) return;
  lastPublish = now;

  float current = analogRead(CURRENT_PIN) * (CURRENT_FULL_SCALE / 4095.0);
  bool stall = current > STALL_CURRENT_A;
  batteryPercent = max(0.0f, batteryPercent - 0.005f);

  char payload[480];
  snprintf(payload, sizeof(payload),
    "{\"robot_id\":\"agbot_esp32_m04\",\"timestamp\":%lu,"
    "\"location\":{\"latitude\":-29.116169,\"longitude\":-51.224500,\"altitude_m\":750.2},"
    "\"status\":{\"battery_percent\":%.2f,\"active_module\":\"M04_MOINHO_ROTATIVO\",\"speed_kmh\":1.8,\"e_stop\":%s},"
    "\"telemetry_m04\":{\"motor_current_amp\":%.1f,\"depth_cm\":8,\"soil_resistance_index\":%.2f}}",
    now / 1000, batteryPercent, stall ? "true" : "false", current, current / 4.0);

  if (mqtt.publish(MQTT_TOPIC, payload)) {
    Serial.printf("--> %s\n", payload);
  }
}
