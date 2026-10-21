# Guia de Execução: Portfólio AgBot (Software-Only)

Este repositório contém a implementação do ecossistema de software para o projeto **AgBot**, focado em automação agrícola sustentável.

## Estrutura do Projeto

- `/backend`: API FastAPI para processamento e redistribuição de dados via WebSockets.
- `/frontend`: Dashboard interativo (React/Mapbox) para monitoramento em tempo real.
- `/firmware`: Código simulado para ESP32 (Wokwi).
- `/simulation`: Scripts Python para simular a movimentação e telemetria do robô.
- `/data`: Arquivos GeoJSON da área rural.

## Como Executar

### 1. Ambiente Python
No Ubuntu/Debian, instale o suporte a ambientes virtuais e crie o ambiente do backend:
```bash
sudo apt install python3.12-venv
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

### 2. Simulador de Telemetria
Em um terminal separado, a partir da raiz do repositório:
```bash
backend/.venv/bin/python simulation/telemetry_engine.py
```

### 3. Backend
Na raiz do repositório:
```bash
backend/.venv/bin/uvicorn main:app --app-dir backend --reload --reload-dir backend --host 0.0.0.0 --port 8000
```

### 4. Dashboard em tempo real
Em outro terminal, instale as dependências e inicie o frontend:
```bash
cd frontend
npm install
npm run dev
```
Abra o endereço indicado pelo Vite (normalmente `http://localhost:5173`). O dashboard conecta em `ws://localhost:8000/ws/telemetry`; para outro host, defina `VITE_WS_URL` antes de iniciar o Vite. Inicie também o simulador para enviar telemetria.

## Mapa e Terreno 3D
- O modo 3D usa MapLibre e dados de elevação Terrarium; requer WebGL2 habilitado no navegador.
- Sem WebGL2, o dashboard usa Leaflet com tiles raster do OpenStreetMap em 2D.
- O limite da propriedade é carregado de `/data/area.geojson`.

## Tecnologias Utilizadas
- **IoT**: MQTT, ESP32 (simulado).
- **Backend**: Python, FastAPI.
- **GIS**: GeoJSON, tiles OpenStreetMap/CARTO, MapLibre e elevação Terrarium.
- **Frontend**: React, Vite, react-map-gl, MapLibre GL.
