# Firmware simulado · AgBot M04 (ESP32)

Firmware de referência do **Módulo 04 — Moinho Rotativo**, pensado para rodar no simulador [Wokwi](https://wokwi.com) sem hardware físico.

| Arquivo | Conteúdo |
| :--- | :--- |
| [`agbot_m04/agbot_m04.ino`](agbot_m04/agbot_m04.ino) | Sketch Arduino: Wi-Fi, MQTT, leitura de corrente e publicação de telemetria |
| [`agbot_m04/diagram.json`](agbot_m04/diagram.json) | Circuito Wokwi: ESP32 DevKit C + potenciômetro no GPIO34 simulando o sensor de corrente |

## O que o firmware faz

1. Conecta ao Wi-Fi `Wokwi-GUEST`.
2. Conecta ao broker MQTT público `broker.emqx.io:1883`.
3. A cada 2 s lê o ADC (GPIO34) e converte para corrente (0–30 A).
4. Publica um JSON em `agbot/linha30/telemetry`, no **mesmo formato** do simulador Python, para que o backend e o painel exibam os dados sem alteração.

## Como simular

1. Crie um projeto ESP32 em wokwi.com.
2. Cole o conteúdo de `agbot_m04.ino` e de `diagram.json`.
3. Na aba *Library Manager*, adicione **PubSubClient**.
4. Inicie a simulação e gire o potenciômetro para variar a corrente do motor.

Com o backend rodando (veja o [README principal](../README.md)), os dados aparecem no painel em tempo real.
