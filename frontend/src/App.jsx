import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, NavigationControl, ScaleControl, Source } from "react-map-gl/maplibre";
import { CircleMarker, GeoJSON as LeafletGeoJSON, MapContainer, Marker as LeafletMarker, Polyline as LeafletPolyline, ScaleControl as LeafletScaleControl, TileLayer, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import { Activity, Battery, Bot, Cpu, Crosshair, Droplets, Gauge, History, Lock, MapPin, Mountain, Radio, RotateCcw, Route, Server, Thermometer, Waypoints } from "lucide-react";
import Agenda from "./Agenda.jsx";
import DroneIcon from "./DroneIcon.jsx";
import HistoryChart from "./HistoryChart.jsx";
import ReplayBar from "./ReplayBar.jsx";
import { LABELS, PLACES, boundaryGeoJson, bounds, farmGeoJson, toLngLat } from "./farm.js";
import { MODULES, findModule, moduleTelemetry } from "./modules.js";
import { buildDay } from "./plan.js";
import { agbotState, droneState, hubState, performedPath, taskSamples } from "./simulate.js";
import { MQTT_TOPIC, WOKWI_URL, connectBackend, connectMqtt } from "./sources.js";

const [dockLng, dockLat] = toLngLat(...PLACES.dock);
const defaultLocation = { latitude: dockLat, longitude: dockLng };
const mapStyle = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const maxTrailPoints = 240;
const maxHistoryPoints = 3600;
const robotIcon = L.divIcon({
  className: "leaflet-robot-icon",
  html: '<span class="leaflet-robot-pulse"></span><span class="leaflet-robot-core"></span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});
const droneLeafletIcon = L.divIcon({ className: "leaflet-drone-icon", html: '<span class="leaflet-drone-core"></span>', iconSize: [22, 22], iconAnchor: [11, 11] });

// Rampa sequencial (um só matiz, claro → escuro) para a umidade do solo.
const MOISTURE_STOPS = [[22, "#cde2fb"], [28, "#9ec5f4"], [32, "#5598e7"], [36, "#2a78d6"], [40, "#1c5cab"], [46, "#0d366b"]];
const BATTERY_COLOR = "#416c41";
const MOISTURE_COLOR = "#2a78d6";
const ALTITUDE_COLOR = "#6a5aa8";
const TRAIL_COLOR = "#d4673e";
const DRONE_COLOR = "#6a5aa8";
const CELL_DEG = 0.00004; // célula do mapa de umidade (~4 m)
const CELL_AREA_M2 = (CELL_DEG * 111320) * (CELL_DEG * 111320 * Math.cos((29.116 * Math.PI) / 180));

const FARM_STYLE = {
  boundary: { color: "#568044", weight: 2, dashArray: "6 5", fillColor: "#eef2e4", fillOpacity: 0.85 },
  lawn: { stroke: false, fillColor: "#d3e6bd", fillOpacity: 0.9 },
  plot: (feature) => ({ stroke: false, fillColor: feature.properties.color, fillOpacity: 0.95 }),
  bed: { color: "#9db57f", weight: 1, opacity: 0.8 },
  orchard: { stroke: false, fillColor: "#e4ecd3", fillOpacity: 0.9 },
  forest: { color: "#7ea56a", weight: 1, fillColor: "#93b57d", fillOpacity: 0.85 },
  water: { color: "#8fb7bd", weight: 1, fillColor: "#b9d7dc", fillOpacity: 1 },
  road: { color: "#e6dcc6", weight: 4, lineCap: "round" },
  building: { color: "#b4aa95", weight: 1, fillColor: "#dcd5c6", fillOpacity: 1 },
  pad: { color: "#b4aa95", weight: 1, dashArray: "2 2", fillColor: "#efe9dc", fillOpacity: 1 },
};
const is = (kind) => ["==", ["get", "kind"], kind];

const params = new URLSearchParams(window.location.search);
const staticHost = !["localhost", "127.0.0.1"].includes(window.location.hostname) && !import.meta.env.VITE_WS_URL;
const SOURCES = [
  ...(staticHost ? [] : [{ id: "aghub", label: "AgHub", title: "Backend local (WebSocket + histórico em SQLite)" }]),
  { id: "esp32", label: "ESP32", title: `Firmware no Wokwi via broker MQTT público (${MQTT_TOPIC})` },
  { id: "demo", label: "Demo", title: "Um dia de operação simulado no navegador" },
];

function initialSource() {
  if (params.has("demo")) return "demo";
  const requested = params.get("fonte");
  if (SOURCES.some((source) => source.id === requested)) return requested;
  return staticHost ? "demo" : "aghub";
}

const numberFormats = {};
function fmt(value, digits = 2) {
  if (value == null || value === "") return null;
  if (typeof value !== "number") return String(value);
  numberFormats[digits] ??= new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits });
  return numberFormats[digits].format(value);
}
const clockFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
function formatTime(ms) {
  if (!ms) return "Aguardando sinal";
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(ms));
}

function toPoint(payload, t) {
  return {
    t,
    lat: Number(payload.location?.latitude),
    lng: Number(payload.location?.longitude),
    battery: Number(payload.status?.battery_percent),
    moisture: Number(payload.environmental?.soil_moisture_percent),
    module: payload.status?.active_module ?? null,
  };
}

function hexToRgb(hex) { return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); }
function moistureColor(value) {
  if (value <= MOISTURE_STOPS[0][0]) return MOISTURE_STOPS[0][1];
  for (let i = 1; i < MOISTURE_STOPS.length; i += 1) {
    const [v1, c1] = MOISTURE_STOPS[i];
    if (value <= v1) {
      const [v0, c0] = MOISTURE_STOPS[i - 1];
      const k = (value - v0) / (v1 - v0);
      const [a, b] = [hexToRgb(c0), hexToRgb(c1)];
      return `rgb(${a.map((channel, j) => Math.round(channel + (b[j] - channel) * k)).join(",")})`;
    }
  }
  return MOISTURE_STOPS[MOISTURE_STOPS.length - 1][1];
}

// Agrupa as leituras em células e tira a média: vira o mapa de umidade medida.
function moistureCells(points) {
  const cells = new globalThis.Map();
  for (const point of points) {
    if (!Number.isFinite(point.moisture) || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) continue;
    const key = `${Math.floor(point.lat / CELL_DEG)}:${Math.floor(point.lng / CELL_DEG)}`;
    const cell = cells.get(key) ?? { lat: 0, lng: 0, sum: 0, n: 0 };
    cell.lat += point.lat; cell.lng += point.lng; cell.sum += point.moisture; cell.n += 1;
    cells.set(key, cell);
  }
  return [...cells.values()].map((cell) => ({ lat: cell.lat / cell.n, lng: cell.lng / cell.n, moisture: cell.sum / cell.n, n: cell.n }));
}

const lineFeature = (coordinates) => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } });

function RasterMapRef({ mapRef }) {
  const leafletMap = useMap();
  useEffect(() => {
    mapRef.current = leafletMap;
    return () => { mapRef.current = null; };
  }, [leafletMap, mapRef]);
  return null;
}

function Metric({ icon: Icon, label, value, unit, accent = "" }) {
  return (
    <div className="metric">
      <span className={`metric-icon ${accent}`}><Icon size={16} strokeWidth={1.8} /></span>
      <div className="metric-copy">
        <span className="metric-label">{label}</span>
        <strong>{value ?? "--"}<small>{value == null ? "" : unit}</small></strong>
      </div>
    </div>
  );
}

function AgentRow({ icon, name, badge, state, detail, active }) {
  return (
    <div className={`agent-row ${active ? "active" : ""}`}>
      <span className="agent-icon">{icon}</span>
      <div className="agent-copy">
        <span className="agent-name">{name}{badge && <em>{badge}</em>}</span>
        <strong>{state}</strong>
        {detail && <small>{detail}</small>}
      </div>
      <span className="agent-dot" title={active ? "Ativo" : "Em espera"} />
    </div>
  );
}

export default function App() {
  const [source, setSource] = useState(initialSource);
  const [telemetry, setTelemetry] = useState(null);
  const [lastReceived, setLastReceived] = useState(null);
  const [history, setHistory] = useState([]);
  const [connection, setConnection] = useState("connecting");
  const [map, setMap] = useState(null);
  const [viewMode, setViewMode] = useState("2d");
  const [mapLayer, setMapLayer] = useState("trail");
  const [day] = useState(() => buildDay());
  const [clock, setClock] = useState(() => Date.now());
  const [replay, setReplay] = useState(null); // { taskId, cursor, playing, speed }
  const rasterMap = useRef(null);
  const headingRef = useRef(null);
  const [supportsWebGL2] = useState(() => Boolean(document.createElement("canvas").getContext("webgl2")));
  const isDemo = source === "demo";

  const handleTelemetry = useCallback((payload, t = Date.now()) => {
    setTelemetry(payload);
    setLastReceived(t);
    setHistory((points) => [...points, toPoint(payload, t)].slice(-maxHistoryPoints));
  }, []);

  function changeSource(next) {
    if (next === source) return;
    setSource(next);
    setReplay(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("demo");
    url.searchParams.set("fonte", next);
    window.history.replaceState(null, "", url);
  }

  // Fontes reais (AgHub e ESP32).
  useEffect(() => {
    setTelemetry(null);
    setLastReceived(null);
    setHistory([]);
    if (source === "demo") {
      setConnection("demo");
      return undefined;
    }
    if (source === "esp32") return connectMqtt({ onData: handleTelemetry, onState: setConnection });
    return connectBackend({
      onData: handleTelemetry,
      onState: setConnection,
      onGiveUp: () => setSource("demo"),
      onHistory: (points) => {
        const stored = points.map((point) => ({ t: point.ts * 1000, lat: point.lat, lng: point.lng, battery: point.battery, moisture: point.moisture, module: point.module }));
        const lastStored = stored.length ? stored[stored.length - 1].t : 0;
        // A leitura reenviada pelo WebSocket ao conectar já está no histórico: descarta duplicatas.
        setHistory((live) => [...stored, ...live.filter((point) => point.t > lastStored + 1500)].slice(-maxHistoryPoints));
      },
    });
  }, [source, handleTelemetry]);

  // Relógio do modo demonstração.
  useEffect(() => {
    if (!isDemo) return undefined;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isDemo]);

  // Reprodução da retrospectiva.
  const replayTask = replay ? day.all.find((task) => task.id === replay.taskId) : null;
  useEffect(() => {
    if (!replay?.playing) return undefined;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const nowPerf = performance.now();
      const dt = nowPerf - last;
      last = nowPerf;
      setReplay((current) => {
        if (!current?.playing) return current;
        const task = day.all.find((item) => item.id === current.taskId);
        const cursor = Math.min(task.end, current.cursor + dt * current.speed);
        return { ...current, cursor, playing: cursor < task.end };
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [replay?.playing, replay?.taskId, day]);

  function startReplay(task) {
    setReplay({ taskId: task.id, cursor: task.start, playing: true, speed: 8 });
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const viewTime = replay ? replay.cursor : clock;

  // Estado do dia simulado no horário em exibição (ao vivo ou na retrospectiva).
  const demo = useMemo(() => {
    if (!isDemo) return null;
    const agbot = agbotState(day, viewTime);
    const drone = droneState(day, viewTime);
    const hub = hubState(day, viewTime);
    const lastDone = [...day.agbot].reverse().find((task) => task.end < viewTime);
    const focus = replayTask ?? agbot.task ?? lastDone ?? day.agbot[0];
    const until = (task) => (Math.min(viewTime, task.end) - task.start) / 1000;
    const trail = focus.agent === "agbot" && viewTime >= focus.start ? performedPath(focus, until(focus)) : [];
    const droneTask = focus.agent === "drone" ? focus : drone.task;
    const droneTrail = droneTask && viewTime >= droneTask.start ? performedPath(droneTask, until(droneTask)) : [];
    const samples = taskSamples(day, focus).filter((sample) => sample.t <= viewTime);
    const moistureTasks = replayTask ? (replayTask.agent === "agbot" ? [replayTask] : []) : day.agbot.filter((task) => task.start <= viewTime);
    const moisturePoints = moistureTasks.flatMap((task) => taskSamples(day, task).filter((sample) => sample.work && sample.t <= viewTime));
    return { agbot, drone, hub, focus, trail, planned: focus.agent === "agbot" ? focus.coords : [], droneTrail, dronePlanned: droneTask?.coords ?? [], samples, moisturePoints };
  }, [isDemo, day, viewTime, replayTask]);

  const current = isDemo ? demo.agbot.payload : telemetry;
  const hasSignal = Boolean(current);
  const location = current?.location ?? defaultLocation;
  const status = current?.status ?? {};
  const environment = current?.environmental ?? {};
  const activeModule = findModule(status.active_module);
  const moduleData = moduleTelemetry(current, activeModule);
  const moduleRows = activeModule
    ? activeModule.metrics.map((metric) => ({ ...metric, value: metric.format ? (moduleData[metric.key] == null ? null : metric.format(moduleData[metric.key])) : fmt(moduleData[metric.key]) }))
    : Object.entries(moduleData).map(([key, value]) => ({ key, label: key, unit: "", value: fmt(value) }));
  const nextTask = isDemo && !replay ? demo.agbot.nextTask : null;

  const historyTrail = useMemo(
    () => history.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)).slice(-maxTrailPoints).map((point) => [point.lng, point.lat]),
    [history],
  );
  const trail = isDemo ? demo.trail : historyTrail;
  const planned = isDemo ? demo.planned : [];
  const droneTrail = isDemo ? demo.droneTrail : [];
  const dronePlanned = isDemo ? demo.dronePlanned : [];
  const seriesSource = isDemo ? demo.samples : history;
  const cells = useMemo(() => moistureCells(isDemo ? demo.moisturePoints : history), [isDemo, demo, history]);
  const cellsGeoJson = useMemo(() => ({
    type: "FeatureCollection",
    features: cells.map((cell) => ({ type: "Feature", properties: { moisture: cell.moisture }, geometry: { type: "Point", coordinates: [cell.lng, cell.lat] } })),
  }), [cells]);
  const focusIsDrone = isDemo && demo.focus.agent === "drone";
  const chartA = useMemo(() => seriesSource.map((point) => ({ t: point.t, v: point.battery })), [seriesSource]);
  const chartB = useMemo(() => seriesSource.map((point) => ({ t: point.t, v: focusIsDrone ? point.altitude : point.moisture })), [seriesSource, focusIsDrone]);
  const moistureStats = useMemo(() => {
    const values = cells.map((cell) => cell.moisture);
    if (!values.length) return null;
    return { mean: values.reduce((sum, value) => sum + value, 0) / values.length, min: Math.min(...values), max: Math.max(...values), area: values.length * CELL_AREA_M2 };
  }, [cells]);

  const connectionText = { connected: "Conectado", connecting: "Conectando", reconnecting: "Reconectando", waiting: "Aguardando ESP32", error: "Instável", demo: "Modo demonstração" }[connection];
  const focusModule = isDemo ? findModule(demo.focus.module) : null;
  const historyTitle = isDemo ? "Dados da atividade" : "Histórico";
  const historyNote = isDemo
    ? `${focusIsDrone ? "Infodrone" : focusModule?.code} · ${demo.focus.title} · ${clockFormat.format(demo.focus.start)}–${clockFormat.format(demo.focus.end)}`
    : { aghub: "Gravado no AgHub (SQLite) · últimas 2 horas", esp32: "Leituras recebidas desde que o painel foi aberto" }[source];
  const moistureNote = isDemo ? (replay ? "Medida nesta atividade" : "Medida hoje pelo AgBot") : "Medida nas leituras recebidas";

  function centerRobot() {
    map?.flyTo({ center: [location.longitude, location.latitude], zoom: 18, pitch: viewMode === "3d" ? 60 : 0, duration: 900 });
    rasterMap.current?.flyTo([location.latitude, location.longitude], 18, { duration: 0.9 });
  }
  function changeViewMode(mode) {
    setViewMode(mode);
    map?.easeTo({ pitch: mode === "3d" ? 62 : 0, bearing: mode === "3d" ? 18 : 0, duration: 900 });
  }

  const moistureColorExpression = ["interpolate", ["linear"], ["get", "moisture"], ...MOISTURE_STOPS.flat()];
  const dim = mapLayer === "moisture";
  const zoomWidth = (low, high) => ["interpolate", ["exponential", 2], ["zoom"], 16, low, 19, high];

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href={import.meta.env.DEV ? "#inicio" : "../index.html"} aria-label="Terra Sana, voltar ao site">
          <span className="brand-mark"><Bot size={21} strokeWidth={1.8} /></span>
          <span className="brand-name">AG<span>BOT</span><small>SISTEMAS DE CAMPO</small></span>
        </a>
        <div className="topbar-center"><span className="workspace-label">OPERAÇÃO DE CAMPO</span><span className="workspace-divider" /><span className="workspace-location"><MapPin size={14} /> Estr. Ver. Marcial Pisoni · Linha 40</span></div>
        <div className="topbar-right">
          <div className="source-switch" role="group" aria-label="Fonte da telemetria">
            {SOURCES.map((option) => (
              <button key={option.id} type="button" className={source === option.id ? "selected" : ""} aria-pressed={source === option.id} title={option.title} onClick={() => changeSource(option.id)}>{option.label}</button>
            ))}
          </div>
          <div className={`connection-state ${connection}`}><span className="connection-dot" /><Radio size={15} /><span className="connection-text">{connectionText}</span></div>
        </div>
      </header>

      <section className="page-heading" id="inicio" ref={headingRef}>
        <div>
          <p className="eyebrow">CENTRO DE CONTROLE <span> / </span> {replay ? "RETROSPECTIVA" : "UNIDADE 01"}</p>
          <h1>{replay ? <>Retrospectiva <em>da atividade</em></> : <>Monitoramento <em>ao vivo</em></>}</h1>
          {replayTask && (
            <p className="heading-task">
              {replayTask.agent === "drone" ? <DroneIcon size={14} /> : <Route size={14} />}
              {replayTask.agent === "drone" ? "Infodrone" : findModule(replayTask.module)?.code} · {replayTask.title} · {replayTask.zone} · {clockFormat.format(replayTask.start)}–{clockFormat.format(replayTask.end)}
            </p>
          )}
        </div>
        <div className="last-update"><Activity size={15} /><span>{replay ? "HORÁRIO NA REPRODUÇÃO" : "ÚLTIMA TELEMETRIA"}</span><strong>{formatTime(isDemo ? viewTime : lastReceived)}</strong></div>
      </section>

      <ul className="module-strip" aria-label="Módulos do AgBot: um acoplado por vez">
        {MODULES.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule?.id === module.id;
          const isNext = !isActive && nextTask?.module === module.id;
          const state = isActive ? "Acoplado" : isNext ? `A seguir · ${clockFormat.format(nextTask.start)}` : "Bloqueado";
          return (
            <li key={module.id} className={`module-chip ${isActive ? "active" : isNext ? "next" : "locked"}`} aria-current={isActive ? "true" : undefined} title={`${module.fullName} · ${state}`}>
              {isActive || isNext ? <Icon size={15} strokeWidth={1.8} /> : <Lock size={13} strokeWidth={1.8} />}
              <span><b>{module.code} · {state}</b>{module.name}</span>
            </li>
          );
        })}
      </ul>

      {replayTask && (
        <ReplayBar
          task={replayTask}
          cursor={replay.cursor}
          playing={replay.playing}
          speed={replay.speed}
          onSeek={(cursor, play) => setReplay((r) => ({ ...r, cursor, playing: play ?? r.playing }))}
          onTogglePlay={() => setReplay((r) => ({ ...r, playing: !r.playing }))}
          onSpeed={(speed) => setReplay((r) => ({ ...r, speed }))}
          onExit={() => setReplay(null)}
        />
      )}

      <section className="dashboard" aria-label="Painel de monitoramento do AgBot">
        <div className="map-panel">
          {supportsWebGL2 ? (
            <Map
              ref={setMap}
              initialViewState={{ bounds: [[bounds.lngMin, bounds.latMin], [bounds.lngMax, bounds.latMax]], fitBoundsOptions: { padding: { top: 120, bottom: 90, left: 50, right: 70 } } }}
              mapStyle={mapStyle}
              maxPitch={85}
              terrain={viewMode === "3d" ? { source: "terrain-dem", exaggeration: 1.35 } : undefined}
              attributionControl={{ compact: true }}
              reuseMaps
            >
              <Source id="terrain-dem" type="raster-dem" tiles={["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"]} encoding="terrarium" tileSize={256} maxzoom={15} />
              <Source id="field-boundary" type="geojson" data={boundaryGeoJson}>
                <Layer id="field-fill" type="fill" paint={{ "fill-color": "#eef2e4", "fill-opacity": 0.85 }} />
              </Source>
              <Source id="farm" type="geojson" data={farmGeoJson}>
                <Layer id="farm-lawn" type="fill" filter={is("lawn")} paint={{ "fill-color": "#d3e6bd", "fill-opacity": dim ? 0.4 : 0.9 }} />
                <Layer id="farm-plot" type="fill" filter={is("plot")} paint={{ "fill-color": ["get", "color"], "fill-opacity": dim ? 0.35 : 0.95 }} />
                <Layer id="farm-bed" type="line" filter={is("bed")} paint={{ "line-color": "#9db57f", "line-width": zoomWidth(0.35, 1.6), "line-opacity": dim ? 0.3 : 0.85 }} />
                <Layer id="farm-orchard" type="fill" filter={is("orchard")} paint={{ "fill-color": "#e4ecd3", "fill-opacity": dim ? 0.4 : 0.9 }} />
                <Layer id="farm-forest" type="fill" filter={is("forest")} paint={{ "fill-color": "#93b57d", "fill-opacity": 0.85, "fill-outline-color": "#7ea56a" }} />
                <Layer id="farm-water" type="fill" filter={is("water")} paint={{ "fill-color": "#b9d7dc", "fill-outline-color": "#8fb7bd" }} />
                <Layer id="farm-road" type="line" filter={is("road")} layout={{ "line-cap": "round", "line-join": "round" }} paint={{ "line-color": "#e3d8c1", "line-width": zoomWidth(1.6, 9) }} />
                <Layer id="farm-building" type="fill" filter={is("building")} paint={{ "fill-color": "#dcd5c6", "fill-outline-color": "#a99f89" }} />
                <Layer id="farm-pad" type="fill" filter={is("pad")} paint={{ "fill-color": "#efe9dc", "fill-outline-color": "#a99f89" }} />
                <Layer id="farm-tree" type="circle" filter={is("tree")} paint={{ "circle-color": "#6b9558", "circle-radius": zoomWidth(1.4, 7), "circle-stroke-color": "#fffefa", "circle-stroke-width": 0.6, "circle-opacity": dim ? 0.4 : 1 }} />
                <Layer id="farm-logs" type="circle" filter={is("logs")} paint={{ "circle-color": "#8b6b47", "circle-radius": zoomWidth(1.1, 4.5) }} />
              </Source>
              <Source id="field-outline-src" type="geojson" data={boundaryGeoJson}>
                <Layer id="field-outline" type="line" paint={{ "line-color": "#568044", "line-width": 2, "line-dasharray": [2, 2] }} />
              </Source>
              {mapLayer === "moisture" && (
                <Source id="moisture-cells" type="geojson" data={cellsGeoJson}>
                  <Layer id="moisture-circles" type="circle" paint={{ "circle-color": moistureColorExpression, "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 16, 3, 18, 9, 20, 30], "circle-opacity": 0.85, "circle-stroke-color": "#fffefa", "circle-stroke-width": 1 }} />
                </Source>
              )}
              {mapLayer === "trail" && planned.length > 1 && (
                <Source id="planned-path" type="geojson" data={lineFeature(planned)}>
                  <Layer id="planned-line" type="line" layout={{ "line-join": "round" }} paint={{ "line-color": TRAIL_COLOR, "line-width": 1.2, "line-opacity": 0.35, "line-dasharray": [2, 2] }} />
                </Source>
              )}
              {mapLayer === "trail" && trail.length > 1 && (
                <Source id="robot-trail" type="geojson" data={lineFeature(trail)}>
                  <Layer id="trail-shadow" type="line" layout={{ "line-join": "round" }} paint={{ "line-color": "#fffefa", "line-width": 5, "line-opacity": 0.8 }} />
                  <Layer id="trail-line" type="line" layout={{ "line-join": "round" }} paint={{ "line-color": TRAIL_COLOR, "line-width": 2.2, "line-opacity": 0.9 }} />
                </Source>
              )}
              {mapLayer === "trail" && dronePlanned.length > 1 && (
                <Source id="drone-planned" type="geojson" data={lineFeature(dronePlanned)}>
                  <Layer id="drone-planned-line" type="line" paint={{ "line-color": DRONE_COLOR, "line-width": 1.2, "line-opacity": 0.35, "line-dasharray": [1, 2] }} />
                </Source>
              )}
              {mapLayer === "trail" && droneTrail.length > 1 && (
                <Source id="drone-trail" type="geojson" data={lineFeature(droneTrail)}>
                  <Layer id="drone-trail-line" type="line" layout={{ "line-join": "round" }} paint={{ "line-color": DRONE_COLOR, "line-width": 2, "line-opacity": 0.85 }} />
                </Source>
              )}
              {LABELS.map((label) => (
                <Marker key={label.text} longitude={label.lngLat[0]} latitude={label.lngLat[1]} anchor={label.align === "below" ? "top" : "center"}>
                  <span className="farm-label">{label.text}</span>
                </Marker>
              ))}
              {hasSignal && (
                <Marker latitude={location.latitude} longitude={location.longitude} anchor="center">
                  <div className="robot-marker" aria-label="Posição atual do AgBot"><span className="marker-pulse" /><Bot size={19} strokeWidth={2} /></div>
                </Marker>
              )}
              {isDemo && (
                <Marker longitude={demo.drone.lngLat[0]} latitude={demo.drone.lngLat[1]} anchor="center">
                  <div className={`drone-marker ${demo.drone.task ? "flying" : ""}`} aria-label="Posição atual do Infodrone">
                    <DroneIcon size={16} strokeWidth={2} />
                    {demo.drone.altitude > 0.5 && <span className="drone-alt">{fmt(demo.drone.altitude, 0)} m</span>}
                  </div>
                </Marker>
              )}
              <NavigationControl position="top-right" showCompass={false} />
              <ScaleControl position="bottom-left" />
            </Map>
          ) : (
            <MapContainer className="raster-map" bounds={[[bounds.latMin, bounds.lngMin], [bounds.latMax, bounds.lngMax]]} zoomControl={false} scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={import.meta.env.DEV ? "/tiles/{z}/{x}/{y}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
              />
              <LeafletGeoJSON data={boundaryGeoJson} style={FARM_STYLE.boundary} />
              <LeafletGeoJSON
                data={farmGeoJson}
                style={(feature) => { const style = FARM_STYLE[feature.properties.kind]; return typeof style === "function" ? style(feature) : style; }}
                pointToLayer={(feature, latlng) => L.circleMarker(latlng, feature.properties.kind === "tree"
                  ? { radius: 3, color: "#fffefa", weight: 0.6, fillColor: "#6b9558", fillOpacity: 1 }
                  : { radius: 2, stroke: false, fillColor: "#8b6b47", fillOpacity: 1 })}
              />
              {mapLayer === "moisture" && cells.map((cell) => (
                <CircleMarker key={`${cell.lat}:${cell.lng}`} center={[cell.lat, cell.lng]} radius={5} pathOptions={{ color: "#fffefa", weight: 1, fillColor: moistureColor(cell.moisture), fillOpacity: 0.85 }} />
              ))}
              {mapLayer === "trail" && planned.length > 1 && <LeafletPolyline positions={planned.map(([lng, lat]) => [lat, lng])} pathOptions={{ color: TRAIL_COLOR, weight: 1.2, opacity: 0.35, dashArray: "4 4" }} />}
              {mapLayer === "trail" && trail.length > 1 && <LeafletPolyline positions={trail.map(([lng, lat]) => [lat, lng])} pathOptions={{ color: TRAIL_COLOR, weight: 2.5 }} />}
              {mapLayer === "trail" && droneTrail.length > 1 && <LeafletPolyline positions={droneTrail.map(([lng, lat]) => [lat, lng])} pathOptions={{ color: DRONE_COLOR, weight: 2 }} />}
              {hasSignal && <LeafletMarker position={[location.latitude, location.longitude]} icon={robotIcon} />}
              {isDemo && <LeafletMarker position={[demo.drone.lngLat[1], demo.drone.lngLat[0]]} icon={droneLeafletIcon} />}
              <ZoomControl position="topright" />
              <LeafletScaleControl position="bottomleft" />
              <RasterMapRef mapRef={rasterMap} />
            </MapContainer>
          )}
          <div className="map-controls">
            <div className="map-mode-toggle" role="group" aria-label="Modo de visualização do mapa">
              <button type="button" className={viewMode === "2d" ? "selected" : ""} aria-pressed={viewMode === "2d"} onClick={() => changeViewMode("2d")}>2D</button>
              <button type="button" className={viewMode === "3d" ? "selected" : ""} aria-pressed={viewMode === "3d"} disabled={!supportsWebGL2} title={supportsWebGL2 ? "Ver terreno em 3D" : "3D requer WebGL2, indisponível neste navegador"} onClick={() => changeViewMode("3d")}><Mountain size={14} /> 3D</button>
            </div>
            <div className="map-mode-toggle" role="group" aria-label="Camada do mapa">
              <button type="button" className={mapLayer === "trail" ? "selected" : ""} aria-pressed={mapLayer === "trail"} onClick={() => setMapLayer("trail")}><Waypoints size={13} /> Percurso</button>
              <button type="button" className={mapLayer === "moisture" ? "selected" : ""} aria-pressed={mapLayer === "moisture"} onClick={() => setMapLayer("moisture")}><Droplets size={13} /> Umidade</button>
            </div>
          </div>
          <div className="map-overlay map-title"><span className="live-indicator" /> POSIÇÃO DO ROBÔ <span className="map-coordinate">{location.latitude.toFixed(5)}°, {location.longitude.toFixed(5)}°</span></div>
          <button className="map-center" type="button" onClick={centerRobot} aria-label="Centralizar no robô" title="Centralizar no robô"><Crosshair size={18} /></button>
          {mapLayer === "trail" ? (
            <div className="map-legend">
              <span className="legend-field" /> Limite
              <span className="legend-trail" /> AgBot
              {isDemo && <><span className="legend-planned" /> Planejado <span className="legend-drone" /> Infodrone</>}
            </div>
          ) : (
            <div className="map-legend moisture-legend">
              <span>Umidade do solo · {moistureNote.toLowerCase()}</span>
              <span className="moisture-scale" style={{ background: `linear-gradient(90deg, ${MOISTURE_STOPS.map(([, color]) => color).join(", ")})` }} />
              <span className="moisture-scale-labels"><span>{MOISTURE_STOPS[0][0]}% seco</span><span>{MOISTURE_STOPS[MOISTURE_STOPS.length - 1][0]}% úmido</span></span>
            </div>
          )}
          {source === "esp32" && !telemetry && (
            <div className="map-waiting" role="status">
              <Cpu size={20} />
              <strong>Aguardando o ESP32</strong>
              <p>O painel está ouvindo o tópico <code>{MQTT_TOPIC}</code> no broker público. Inicie a simulação do firmware e as leituras aparecem aqui.</p>
              {WOKWI_URL && <a href={WOKWI_URL} target="_blank" rel="noreferrer">Abrir simulação no Wokwi ↗</a>}
            </div>
          )}
        </div>

        <aside className="telemetry-panel">
          {isDemo ? (
            <>
              <div className="section-rule"><span>AGENTES</span><span className="section-rule-line" /></div>
              <div className="agents">
                <AgentRow icon={<Server size={17} strokeWidth={1.8} />} name="AgHub" badge="sempre ativo" state="Estação central online" detail={`Rede ${demo.hub.grid} · ${demo.hub.rtk} · reservatório ${fmt(demo.hub.water, 0)}%`} active />
                <AgentRow
                  icon={<DroneIcon size={17} />}
                  name="Infodrone"
                  state={demo.drone.phase}
                  detail={demo.drone.task
                    ? `${demo.drone.task.title} · ${fmt(demo.drone.altitude, 0)} m · bateria ${fmt(demo.drone.battery, 0)}%`
                    : `Bateria ${fmt(demo.drone.battery, 0)}%${demo.drone.nextTask ? ` · próximo voo ${clockFormat.format(demo.drone.nextTask.start)}` : ""}`}
                  active={Boolean(demo.drone.task)}
                />
                <AgentRow
                  icon={<Bot size={17} strokeWidth={1.8} />}
                  name="AgBot"
                  state={demo.agbot.phase}
                  detail={demo.agbot.task
                    ? `${findModule(demo.agbot.task.module)?.code} · ${demo.agbot.task.title} · até ${clockFormat.format(demo.agbot.task.end)}`
                    : demo.agbot.nextTask ? `Próximo: ${demo.agbot.nextTask.title} às ${clockFormat.format(demo.agbot.nextTask.start)}` : "Agenda do dia concluída"}
                  active={Boolean(demo.agbot.task)}
                />
              </div>
            </>
          ) : (
            <div className="robot-card">
              <div className="robot-avatar"><Bot size={24} strokeWidth={1.7} /></div>
              <div className="robot-identity"><span>UNIDADE MÓVEL</span><h2>AgBot Protótipo</h2><small>{telemetry?.robot_id ?? "agbot_prototipo_v1"}</small></div>
              <span className={`robot-state ${!hasSignal ? "idle" : status.e_stop ? "alert" : ""}`}><i />{!hasSignal ? "Sem sinal" : status.e_stop ? "Parada de emergência" : "Em operação"}</span>
            </div>
          )}

          <div className="section-rule"><span>ENERGIA · AGBOT</span><span className="section-rule-line" /></div>
          <div className="battery-block">
            <div className="battery-top"><span><Battery size={15} /> BATERIA</span><strong>{fmt(status.battery_percent, 1) ?? "--"}<small>{status.battery_percent == null ? "" : "%"}</small></strong></div>
            <div className="battery-track"><span style={{ width: `${Math.max(0, Math.min(100, Number(status.battery_percent) || 0))}%` }} /></div>
          </div>

          <div className="section-rule"><span>TELEMETRIA</span><span className="section-rule-line" /></div>
          <div className="metric-grid">
            <Metric icon={Gauge} label="Velocidade" value={fmt(status.speed_kmh)} unit=" km/h" accent="orange" />
            <Metric icon={Droplets} label="Umidade do solo" value={fmt(environment.soil_moisture_percent, 1)} unit="%" accent="blue" />
            <Metric icon={Thermometer} label="Temperatura" value={fmt(environment.ambient_temp_c, 1)} unit=" °C" accent="green" />
            {isDemo
              ? <Metric icon={Route} label="Percorrido" value={demo.agbot.sample ? fmt(demo.agbot.sample.distance, 0) : null} unit=" m" accent="slate" />
              : <Metric icon={History} label="Leituras" value={history.length ? fmt(history.length, 0) : null} unit="" accent="slate" />}
          </div>

          <div className="module-card">
            <div className="module-heading"><Waypoints size={15} /><span>MÓDULO ACOPLADO</span>{activeModule && <span className="module-live"><i /> ATIVO</span>}</div>
            <strong>{activeModule ? `${activeModule.code} · ${activeModule.fullName}` : isDemo ? "Nenhum · AgBot na doca" : status.active_module?.replaceAll("_", " ") ?? "Aguardando dados"}</strong>
            {moduleRows.map((row) => (
              <div className="module-details" key={row.key}><span>{row.label}</span><b>{row.value ?? "--"}<small>{row.value == null ? "" : row.unit}</small></b></div>
            ))}
          </div>

          <div className="panel-footer"><span><MapPin size={13} /> ALTITUDE</span><strong>{fmt(location.altitude_m, 1) ?? "--"}<small>{location.altitude_m == null ? "" : " m"}</small></strong><span className="footer-divider" /><span className="stream-label"><Radio size={13} /> {{ demo: replay ? "RETROSPECTIVA" : "SIMULAÇÃO LOCAL", esp32: "MQTT PÚBLICO", aghub: "STREAM WS" }[source]}</span></div>
        </aside>
      </section>

      {isDemo && (
        <Agenda
          day={day}
          now={clock}
          cursor={replay ? replay.cursor : null}
          selectedId={replay?.taskId ?? demo.agbot.task?.id}
          onReplay={startReplay}
          onLive={() => setReplay(null)}
        />
      )}

      <section className="history-section" aria-labelledby="history-heading">
        <div className="history-section-head">
          <h2 id="history-heading">{historyTitle}</h2>
          <span>{historyNote}</span>
        </div>
        <div className="history-grid">
          <HistoryChart title={focusIsDrone ? "Bateria do drone" : "Bateria"} unit="%" points={chartA} color={BATTERY_COLOR} limits={[0, 100]} tStart={isDemo ? demo.focus.start : undefined} tEnd={isDemo ? demo.focus.end : undefined} />
          <HistoryChart title={focusIsDrone ? "Altitude" : "Umidade do solo"} unit={focusIsDrone ? " m" : "%"} points={chartB} color={focusIsDrone ? ALTITUDE_COLOR : MOISTURE_COLOR} limits={[0, 100]} tStart={isDemo ? demo.focus.start : undefined} tEnd={isDemo ? demo.focus.end : undefined} />
          <div className="history-card moisture-summary">
            <div className="history-head"><div><span className="history-title">Mapa de umidade</span><strong>{moistureStats ? fmt(moistureStats.mean, 1) : "--"}<small>{moistureStats ? "% média" : ""}</small></strong></div></div>
            <dl>
              <div><dt>Mais seco</dt><dd>{moistureStats ? `${fmt(moistureStats.min, 1)}%` : "--"}</dd></div>
              <div><dt>Mais úmido</dt><dd>{moistureStats ? `${fmt(moistureStats.max, 1)}%` : "--"}</dd></div>
              <div><dt>Área amostrada</dt><dd>{moistureStats ? `${fmt(moistureStats.area, 0)} m²` : "--"}</dd></div>
              <div><dt>Origem</dt><dd className="small">{moistureNote}</dd></div>
            </dl>
            <button type="button" className="history-map-button" onClick={() => setMapLayer("moisture")} disabled={!cells.length}><Droplets size={14} /> Ver no mapa</button>
          </div>
        </div>
      </section>

      <footer className="bottom-bar"><span>AGBOT <b>SISTEMAS DE CAMPO</b></span><span>MONITORAMENTO IoT <i /> GIS EM TEMPO REAL</span><button type="button" onClick={() => window.location.reload()} title="Atualizar painel"><RotateCcw size={14} /> ATUALIZAR</button></footer>
    </main>
  );
}
