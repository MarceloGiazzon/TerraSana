# Guia de Execução: Portfólio AgBot (Software-Only)

Este repositório contém a implementação do ecossistema de software para o projeto **AgBot**, focado em automação agrícola sustentável.

## Estrutura do Projeto

- `/backend`: API FastAPI para processamento e redistribuição de dados via WebSockets.
- `/frontend`: Dashboard interativo (React/Mapbox) para monitoramento em tempo real.
- `/firmware`: Código simulado para ESP32 (Wokwi).
- `/simulation`: Scripts Python para simular a movimentação e telemetria do robô.
- `/data`: Arquivos GeoJSON da área rural.

## Como Executar

### 1. Simulador de Telemetria
```bash
cd simulation
pip install paho-mqtt
python telemetry_engine.py
```

### 2. Backend
```bash
cd backend
pip install fastapi uvicorn paho-mqtt
uvicorn main:app --reload
```

## Tecnologias Utilizadas
- **IoT**: MQTT, ESP32 (simulado).
- **Backend**: Python, FastAPI.
- **GIS**: PostGIS, GeoJSON, Mapbox GL.
- **Frontend**: React, Tailwind CSS.
