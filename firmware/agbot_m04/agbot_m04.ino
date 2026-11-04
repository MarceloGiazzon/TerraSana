// AgBot · Módulo M04 (Moinho Rotativo) — firmware de simulação para ESP32 (Wokwi)
//
// Controles no circuito:
//   - Potenciômetro "corrente" (GPIO34): simula o sensor de corrente do motor (0–60 A)
//   - Potenciômetro "umidade"  (GPIO35): simula o sensor de umidade do solo (10–60 %)
//   - Botão vermelho           (GPIO4):  parada de emergência (liga/desliga)
//
// Publica telemetria em JSON via MQTT, no mesmo formato do simulador Python.
// O painel público (modo "ESP32") lê o mesmo tópico direto do broker.

#include <WiFi.h>
#include <PubSubClient.h>
#include <time.h>

const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";
const char* MQTT_SERVER   = "broker.emqx.io";
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC    = "agbot/linha30/telemetry";

const int   CURRENT_PIN        = 34;     // ADC: sensor de corrente (simulado)
const int   MOISTURE_PIN       = 35;     // ADC: sensor de umidade do solo (simulado)
const int   ESTOP_PIN          = 4;      // botão de emergência (INPUT_PULLUP)
const int   LED_PIN            = 2;      // LED de status: aceso = operando
const float CURRENT_FULL_SCALE = 60.0;   // A em 4095
const float STALL_CURRENT_A    = 55.0;   // limite anti-pedra do M04: acima disso, parada
const unsigned long PUBLISH_MS = 2000;

// Varredura do terreno em faixas (mesmos limites de data/area.geojson)
const double LAT_MIN = -29.116392, LAT_MAX = -29.115946;
const double LNG_MIN = -51.227988, LNG_MAX = -51.224489;
const double LNG_STEP = 0.00004, LAT_STEP = 0.00008;

WiFiClient espClient;
PubSubClient mqtt(espClient);
unsigned long lastPublish = 0;
float batteryPercent = 100.0;
double latitude = -29.116169, longitude = -51.224500;
int lngDir = -1, latDir = 1;
bool eStopLatched = false;
bool lastButton = HIGH;

void setupWifi() {
  Serial.printf("Conectando ao Wi-Fi %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print(".");
  }
  Serial.printf("\nWi-Fi conectado. IP: %s\n", WiFi.localIP().toString().c_str());
  configTime(0, 0, "pool.ntp.org", "time.google.com");  // horário real para o timestamp
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

void advancePosition() {
  longitude += lngDir * LNG_STEP;
  if (longitude <= LNG_MIN || longitude >= LNG_MAX) {
    longitude = constrain(longitude, LNG_MIN, LNG_MAX);
    lngDir = -lngDir;
    double next = latitude + latDir * LAT_STEP;
    if (next > LAT_MAX || next < LAT_MIN) {
      latDir = -latDir;
      next = latitude + latDir * LAT_STEP;
    }
    latitude = next;
  }
}

void readEStopButton() {
  bool button = digitalRead(ESTOP_PIN);
  if (lastButton == HIGH && button == LOW) {  // borda de descida: alterna a parada
    eStopLatched = !eStopLatched;
    Serial.println(eStopLatched ? "!! PARADA DE EMERGÊNCIA" : "Parada liberada");
  }
  lastButton = button;
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  pinMode(ESTOP_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  setupWifi();
  mqtt.setServer(MQTT_SERVER, MQTT_PORT);
  mqtt.setBufferSize(640);
}

void loop() {
  if (!mqtt.connected()) reconnectMqtt();
  mqtt.loop();
  readEStopButton();

  unsigned long now = millis();
  if (now - lastPublish < PUBLISH_MS) return;
  lastPublish = now;

  float current = analogRead(CURRENT_PIN) * (CURRENT_FULL_SCALE / 4095.0);
  float moisture = 10.0 + analogRead(MOISTURE_PIN) * (50.0 / 4095.0);
  bool stall = current > STALL_CURRENT_A;
  bool stopped = eStopLatched || stall;
  digitalWrite(LED_PIN, stopped ? LOW : HIGH);

  if (!stopped) {
    advancePosition();
    batteryPercent = batteryPercent > 15.0f ? batteryPercent - 0.02f : 100.0f;
  }

  time_t epoch = time(nullptr);
  unsigned long timestamp = epoch > 1700000000 ? (unsigned long)epoch : now / 1000;

  char payload[600];
  snprintf(payload, sizeof(payload),
    "{\"robot_id\":\"agbot_esp32_m04\",\"timestamp\":%lu,"
    "\"location\":{\"latitude\":%.6f,\"longitude\":%.6f,\"altitude_m\":750.2},"
    "\"status\":{\"battery_percent\":%.2f,\"active_module\":\"M04_MOINHO_ROTATIVO\",\"speed_kmh\":%.1f,\"e_stop\":%s},"
    "\"module_telemetry\":{\"motor_current_amp\":%.1f,\"depth_cm\":8,\"soil_resistance_index\":%.2f},"
    "\"environmental\":{\"soil_moisture_percent\":%.1f}}",
    timestamp, latitude, longitude, batteryPercent, stopped ? 0.0 : 1.8,
    stopped ? "true" : "false", current, current / 8.0, moisture);

  if (mqtt.publish(MQTT_TOPIC, payload)) {
    Serial.printf("--> %s\n", payload);
  }
}
