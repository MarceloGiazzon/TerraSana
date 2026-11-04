# Firmware simulado · AgBot M04 (ESP32)

Firmware de referência do **Módulo 04 — Moinho Rotativo**, pensado para rodar no simulador [Wokwi](https://wokwi.com) sem hardware físico. As leituras do ESP32 simulado aparecem no [painel publicado](https://marcelogiazzon.github.io/TerraSana/painel/?fonte=esp32), direto no navegador.

| Arquivo | Conteúdo |
| :--- | :--- |
| [`agbot_m04/agbot_m04.ino`](agbot_m04/agbot_m04.ino) | Sketch Arduino: Wi-Fi, NTP, MQTT, sensores e publicação de telemetria |
| [`agbot_m04/diagram.json`](agbot_m04/diagram.json) | Circuito Wokwi: ESP32 DevKit C, 2 potenciômetros, botão de emergência e LED |
| [`agbot_m04/libraries.txt`](agbot_m04/libraries.txt) | Bibliotecas que o Wokwi instala (PubSubClient) |

## Circuito

| Componente | Pino | Função |
| :--- | :---: | :--- |
| Potenciômetro **Corrente** | GPIO34 | Sensor de corrente do motor (0–60 A). Acima de 55 A o robô para (proteção contra pedra) |
| Potenciômetro **Umidade** | GPIO35 | Sensor de umidade do solo (10–60 %). Pinta o mapa de umidade do painel |
| Botão vermelho **Emergência** | GPIO4 | Liga/desliga a parada de emergência |
| LED verde **Operando** | GPIO2 | Aceso enquanto o robô está em movimento |

## O que o firmware faz

1. Conecta ao Wi-Fi `Wokwi-GUEST` e acerta o relógio por NTP.
2. Conecta ao broker MQTT público `broker.emqx.io:1883`.
3. A cada 2 s lê os sensores, avança a posição em faixas pelo terreno e publica um JSON em `agbot/linha30/telemetry`.
4. O formato é o mesmo do simulador Python (veja o [README principal](../README.md#formato-da-telemetria)), então o backend e o painel exibem os dados sem alteração.

## Como simular

1. Acesse [wokwi.com](https://wokwi.com), entre com sua conta e crie um projeto **ESP32 → Arduino**.
2. Substitua o `sketch.ino` pelo conteúdo de `agbot_m04.ino`.
3. Na aba `diagram.json`, cole o conteúdo de `diagram.json`.
4. Crie o arquivo `libraries.txt` (botão **+** ao lado das abas) com o conteúdo de `libraries.txt`.
5. Clique em ▶. O monitor serial mostra cada mensagem publicada.
6. Abra o [painel no modo ESP32](https://marcelogiazzon.github.io/TerraSana/painel/?fonte=esp32) e gire os potenciômetros ou aperte o botão.

Com o projeto salvo, use **Share** para gerar o link público e coloque-o neste README e em `VITE_WOKWI_URL` (ou direto em [`frontend/src/sources.js`](../frontend/src/sources.js)). Assim o painel mostra um atalho "Abrir simulação no Wokwi".

> O tópico do broker público é aberto: qualquer pessoa pode publicar nele. O painel só exibe mensagens bem-formadas e com coordenadas próximas da propriedade.
