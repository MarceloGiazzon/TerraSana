// Fontes de telemetria do painel: backend AgHub (WebSocket + histórico em SQLite)
// e broker MQTT público (o ESP32 no Wokwi publica direto nele).
import { field } from "./demo.js";

export const MQTT_WS_URL = import.meta.env.VITE_MQTT_WS_URL || "wss://broker.emqx.io:8084/mqtt";
export const MQTT_TOPIC = import.meta.env.VITE_MQTT_TOPIC || "agbot/linha30/telemetry";
export const WOKWI_URL = import.meta.env.VITE_WOKWI_URL || "";

export function websocketUrl() {
  const configuredUrl = import.meta.env.VITE_WS_URL;
  if (configuredUrl) return configuredUrl;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:8010/ws/telemetry`;
}

export function historyUrl(minutes = 120) {
  const url = new URL(websocketUrl());
  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  url.pathname = url.pathname.replace(/\/ws\/telemetry$/, "/telemetry/history");
  url.search = `?minutes=${minutes}&limit=3000`;
  return url.toString();
}

// O tópico público aceita mensagens de qualquer pessoa: só exibimos leituras
// bem-formadas e próximas da propriedade.
const MARGIN = 0.01;
export function isValidTelemetry(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const latitude = Number(payload.location?.latitude);
  const longitude = Number(payload.location?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude < field.latMin - MARGIN || latitude > field.latMax + MARGIN) return false;
  if (longitude < field.lngMin - MARGIN || longitude > field.lngMax + MARGIN) return false;
  return payload.status == null || typeof payload.status === "object";
}

/** Conecta ao backend; retorna função de limpeza. */
export function connectBackend({ onData, onHistory, onState, onGiveUp }) {
  let socket;
  let failures = 0;
  let reconnectTimer;
  let reconnectDelay = 2500;
  let disposed = false;

  async function loadHistory() {
    try {
      const response = await fetch(historyUrl());
      if (!response.ok) return;
      const body = await response.json();
      if (!disposed && Array.isArray(body.points)) onHistory(body.points);
    } catch {
      // Histórico é opcional: o stream ao vivo continua funcionando sem ele.
    }
  }

  function connect() {
    if (disposed) return;
    onState("connecting");
    socket = new WebSocket(websocketUrl());
    socket.onopen = () => {
      reconnectDelay = 2500;
      failures = 0;
      onState("connected");
      loadHistory();
    };
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (isValidTelemetry(payload)) onData(payload);
      } catch {
        onState("error");
      }
    };
    socket.onerror = () => onState("error");
    socket.onclose = () => {
      if (disposed) return;
      failures += 1;
      // Sem backend local após algumas tentativas: o painel cai para a demonstração.
      if (failures >= 3) {
        disposed = true;
        onGiveUp();
        return;
      }
      onState("reconnecting");
      reconnectTimer = window.setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    };
  }

  const initial = window.setTimeout(connect, 0);
  return () => {
    disposed = true;
    window.clearTimeout(initial);
    window.clearTimeout(reconnectTimer);
    socket?.close();
  };
}

/** Assina o tópico no broker MQTT público via WebSocket; retorna função de limpeza. */
export function connectMqtt({ onData, onState }) {
  let client;
  let disposed = false;
  onState("connecting");

  import("mqtt").then(({ default: mqtt }) => {
    if (disposed) return;
    client = mqtt.connect(MQTT_WS_URL, {
      clientId: `terrasana-painel-${Math.random().toString(16).slice(2, 10)}`,
      reconnectPeriod: 4000,
      connectTimeout: 10000,
      clean: true,
    });
    client.on("connect", () => {
      onState("waiting");
      client.subscribe(MQTT_TOPIC);
    });
    client.on("reconnect", () => onState("reconnecting"));
    client.on("error", () => onState("error"));
    client.on("message", (_topic, message) => {
      try {
        const payload = JSON.parse(new TextDecoder().decode(message));
        if (!isValidTelemetry(payload)) return;
        onState("connected");
        onData(payload);
      } catch {
        // mensagem de terceiros fora do formato: ignorada
      }
    });
  }).catch(() => onState("error"));

  return () => {
    disposed = true;
    client?.end(true);
  };
}
