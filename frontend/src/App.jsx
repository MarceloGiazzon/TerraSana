import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, NavigationControl, ScaleControl, Source } from "react-map-gl/maplibre";
import { CircleMarker, MapContainer, Marker as LeafletMarker, Polygon as LeafletPolygon, Polyline as LeafletPolyline, ScaleControl as LeafletScaleControl, TileLayer, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import { Activity, Battery, Bot, Cpu, Crosshair, Droplets, Gauge, History, MapPin, Mountain, Radio, RotateCcw, Thermometer, Waypoints } from "lucide-react";
import areaJson from "../../data/area.geojson?raw";
import HistoryChart from "./HistoryChart.jsx";
import { createDemoSimulator, field } from "./demo.js";
import { MODULES, findModule, moduleTelemetry } from "./modules.js";
import { MQTT_TOPIC, WOKWI_URL, connectBackend, connectMqtt } from "./sources.js";

const defaultLocation = { latitude: -29.116169, longitude: -51.224389 };
const mapStyle = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const maxTrailPoints = 240;
const maxHistoryPoints = 3600;
const area = JSON.parse(areaJson);
const areaPositions = area.features[0].geometry.coordinates[0].map(([longitude, latitude]) => [latitude, longitude]);
const robotIcon = L.divIcon({
  className: "leaflet-robot-icon",
  html: '<span class="leaflet-robot-pulse"></span><span class="leaflet-robot-core"></span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Rampa sequencial (um só matiz, claro → escuro) para a umidade do solo.
const MOISTURE_STOPS = [[22, "#cde2fb"], [28, "#9ec5f4"], [32, "#5598e7"], [36, "#2a78d6"], [40, "#1c5cab"], [46, "#0d366b"]];
const BATTERY_COLOR = "#416c41";
const MOISTURE_COLOR = "#2a78d6";
const CELL_DEG = 0.00004; // célula do mapa de umidade (~4 m)
const CELL_AREA_M2 = (CELL_DEG * 111320) * (CELL_DEG * 111320 * Math.cos((29.116 * Math.PI) / 180));

const params = new URLSearchParams(window.location.search);
const staticHost = !["localhost", "127.0.0.1"].includes(window.location.hostname) && !import.meta.env.VITE_WS_URL;
const SOURCES = [
  ...(staticHost ? [] : [{ id: "aghub", label: "AgHub", title: "Backend local (WebSocket + histórico em SQLite)" }]),
  { id: "esp32", label: "ESP32", title: `Firmware no Wokwi via broker MQTT público (${MQTT_TOPIC})` },
  { id: "demo", label: "Demo", title: "Telemetria simulada no navegador" },
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
function moistureCells(history) {
  const cells = new globalThis.Map();
  for (const point of history) {
    if (!Number.isFinite(point.moisture) || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) continue;
    const key = `${Math.floor(point.lat / CELL_DEG)}:${Math.floor(point.lng / CELL_DEG)}`;
    const cell = cells.get(key) ?? { lat: 0, lng: 0, sum: 0, n: 0 };
    cell.lat += point.lat; cell.lng += point.lng; cell.sum += point.moisture; cell.n += 1;
    cells.set(key, cell);
  }
  return [...cells.values()].map((cell) => ({ lat: cell.lat / cell.n, lng: cell.lng / cell.n, moisture: cell.sum / cell.n, n: cell.n }));
}

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

export default function App() {
  const [source, setSource] = useState(initialSource);
  const [telemetry, setTelemetry] = useState(null);
  const [lastReceived, setLastReceived] = useState(null);
  const [history, setHistory] = useState([]);
  const [connection, setConnection] = useState("connecting");
  const [map, setMap] = useState(null);
  const [viewMode, setViewMode] = useState("2d");
  const [mapLayer, setMapLayer] = useState("trail");
  const rasterMap = useRef(null);
  const demo = useRef(null);
  const [supportsWebGL2] = useState(() => Boolean(document.createElement("canvas").getContext("webgl2")));

  const handleTelemetry = useCallback((payload, t = Date.now()) => {
    setTelemetry(payload);
    setLastReceived(t);
    setHistory((points) => [...points, toPoint(payload, t)].slice(-maxHistoryPoints));
  }, []);

  function changeSource(next) {
    if (next === source) return;
    setSource(next);
    const url = new URL(window.location.href);
    url.searchParams.delete("demo");
    url.searchParams.set("fonte", next);
    window.history.replaceState(null, "", url);
  }

  useEffect(() => {
    setTelemetry(null);
    setLastReceived(null);
    setHistory([]);

    if (source === "demo") {
      setConnection("demo");
      const simulator = createDemoSimulator({
        onPrefill: (payloads) => setHistory(payloads.map((payload) => toPoint(payload, payload.timestamp * 1000))),
        onData: (payload) => handleTelemetry(payload, payload.timestamp * 1000),
      });
      demo.current = simulator;
      return () => { simulator.stop(); demo.current = null; };
    }

    if (source === "esp32") {
      return connectMqtt({ onData: handleTelemetry, onState: setConnection });
    }

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

  const location = telemetry?.location ?? defaultLocation;
  const status = telemetry?.status ?? {};
  const environment = telemetry?.environmental ?? {};
  const activeModule = findModule(status.active_module);
  const moduleData = moduleTelemetry(telemetry, activeModule);
  const moduleRows = activeModule
    ? activeModule.metrics.map((metric) => ({ ...metric, value: metric.format ? (moduleData[metric.key] == null ? null : metric.format(moduleData[metric.key])) : fmt(moduleData[metric.key]) }))
    : Object.entries(moduleData).map(([key, value]) => ({ key, label: key, unit: "", value: fmt(value) }));

  const trail = useMemo(
    () => history.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)).slice(-maxTrailPoints).map((point) => [point.lng, point.lat]),
    [history],
  );
  const cells = useMemo(() => moistureCells(history), [history]);
  const cellsGeoJson = useMemo(() => ({
    type: "FeatureCollection",
    features: cells.map((cell) => ({ type: "Feature", properties: { moisture: cell.moisture }, geometry: { type: "Point", coordinates: [cell.lng, cell.lat] } })),
  }), [cells]);
  const batterySeries = useMemo(() => history.map((point) => ({ t: point.t, v: point.battery })), [history]);
  const moistureSeries = useMemo(() => history.map((point) => ({ t: point.t, v: point.moisture })), [history]);
  const moistureStats = useMemo(() => {
    const values = cells.map((cell) => cell.moisture);
    if (!values.length) return null;
    return {
      mean: values.reduce((sum, value) => sum + value, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      area: values.length * CELL_AREA_M2,
    };
  }, [cells]);

  const trailData = { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: trail } };
  const connectionText = {
    connected: "Conectado",
    connecting: "Conectando",
    reconnecting: "Reconectando",
    waiting: "Aguardando ESP32",
    error: "Instável",
    demo: "Modo demonstração",
  }[connection];
  const historyNote = {
    aghub: "Gravado no AgHub (SQLite) · últimas 2 horas",
    esp32: "Leituras recebidas desde que o painel foi aberto",
    demo: "Simulação no navegador · começa com 10 minutos de operação",
  }[source];

  function centerRobot() {
    map?.flyTo({ center: [location.longitude, location.latitude], zoom: 17, pitch: viewMode === "3d" ? 60 : 0, duration: 900 });
    rasterMap.current?.flyTo([location.latitude, location.longitude], 17, { duration: 0.9 });
  }

  function changeViewMode(mode) {
    setViewMode(mode);
    map?.easeTo({ pitch: mode === "3d" ? 62 : 0, bearing: mode === "3d" ? 18 : 0, duration: 900 });
  }

  const moistureColorExpression = ["interpolate", ["linear"], ["get", "moisture"], ...MOISTURE_STOPS.flat()];

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

      <section className="page-heading" id="inicio">
        <div>
          <p className="eyebrow">CENTRO DE CONTROLE <span> / </span> UNIDADE 01</p>
          <h1>Monitoramento <em>ao vivo</em></h1>
        </div>
        <div className="last-update"><Activity size={15} /><span>ÚLTIMA TELEMETRIA</span><strong>{formatTime(lastReceived)}</strong></div>
      </section>

      <nav className="module-strip" aria-label="Módulos do AgBot">
        {MODULES.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule?.id === module.id;
          return (
            <button
              key={module.id}
              type="button"
              className={`module-chip ${isActive ? "active" : ""}`}
              aria-current={isActive ? "true" : undefined}
              disabled={source !== "demo"}
              title={source === "demo" ? `Acoplar ${module.fullName}` : `${module.fullName} · troca disponível no modo demonstração`}
              onClick={() => demo.current?.setModule(module.id)}
            >
              <Icon size={15} strokeWidth={1.8} />
              <span><b>{module.code}</b>{module.name}</span>
            </button>
          );
        })}
      </nav>

      <section className="dashboard" aria-label="Painel de monitoramento do AgBot">
        <div className="map-panel">
          {supportsWebGL2 ? (
            <Map
              ref={setMap}
              initialViewState={{ bounds: [[field.lngMin, field.latMin], [field.lngMax, field.latMax]], fitBoundsOptions: { padding: { top: 110, bottom: 90, left: 60, right: 80 } } }}
              mapStyle={mapStyle}
              maxPitch={85}
              terrain={viewMode === "3d" ? { source: "terrain-dem", exaggeration: 1.35 } : undefined}
              attributionControl={{ compact: true }}
              reuseMaps
            >
              <Source id="terrain-dem" type="raster-dem" tiles={["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"]} encoding="terrarium" tileSize={256} maxzoom={15} />
              <Source id="field-boundary" type="geojson" data={area}>
                <Layer id="field-fill" type="fill" paint={{ "fill-color": "#719c53", "fill-opacity": mapLayer === "moisture" ? 0.05 : 0.12 }} />
                <Layer id="field-outline" type="line" paint={{ "line-color": "#568044", "line-width": 2, "line-dasharray": [2, 2] }} />
              </Source>
              {mapLayer === "moisture" && (
                <Source id="moisture-cells" type="geojson" data={cellsGeoJson}>
                  <Layer
                    id="moisture-circles"
                    type="circle"
                    paint={{
                      "circle-color": moistureColorExpression,
                      "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 16, 3, 18, 9, 20, 30],
                      "circle-opacity": 0.85,
                      "circle-stroke-color": "#fffefa",
                      "circle-stroke-width": 1,
                    }}
                  />
                </Source>
              )}
              {mapLayer === "trail" && trail.length > 1 && (
                <Source id="robot-trail" type="geojson" data={trailData}>
                  <Layer id="trail-shadow" type="line" paint={{ "line-color": "#fffefa", "line-width": 7, "line-opacity": 0.9 }} />
                  <Layer id="trail-line" type="line" paint={{ "line-color": "#d4673e", "line-width": 3, "line-opacity": 0.9 }} />
                </Source>
              )}
              {telemetry && (
                <Marker latitude={location.latitude} longitude={location.longitude} anchor="center">
                  <div className="robot-marker" aria-label="Posição atual do AgBot"><span className="marker-pulse" /><Bot size={19} strokeWidth={2} /></div>
                </Marker>
              )}
              <NavigationControl position="top-right" showCompass={false} />
              <ScaleControl position="bottom-left" />
            </Map>
          ) : (
            <MapContainer className="raster-map" center={[defaultLocation.latitude, defaultLocation.longitude]} zoom={16} zoomControl={false} scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={import.meta.env.DEV ? "/tiles/{z}/{x}/{y}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
              />
              <LeafletPolygon positions={areaPositions} pathOptions={{ color: "#568044", weight: 2, dashArray: "6 5", fillColor: "#719c53", fillOpacity: 0.12 }} />
              {mapLayer === "moisture" && cells.map((cell) => (
                <CircleMarker key={`${cell.lat}:${cell.lng}`} center={[cell.lat, cell.lng]} radius={5} pathOptions={{ color: "#fffefa", weight: 1, fillColor: moistureColor(cell.moisture), fillOpacity: 0.85 }} />
              ))}
              {mapLayer === "trail" && trail.length > 1 && <LeafletPolyline positions={trail.map(([longitude, latitude]) => [latitude, longitude])} pathOptions={{ color: "#d4673e", weight: 3 }} />}
              {telemetry && <LeafletMarker position={[location.latitude, location.longitude]} icon={robotIcon} />}
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
            <div className="map-legend"><span className="legend-field" /> Limite da propriedade <span className="legend-trail" /> Percurso</div>
          ) : (
            <div className="map-legend moisture-legend">
              <span>Umidade do solo</span>
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
          <div className="robot-card">
            <div className="robot-avatar"><Bot size={24} strokeWidth={1.7} /></div>
            <div className="robot-identity"><span>UNIDADE MÓVEL</span><h2>AgBot Protótipo</h2><small>{telemetry?.robot_id ?? "agbot_prototipo_v1"}</small></div>
            <span className={`robot-state ${!telemetry ? "idle" : status.e_stop ? "alert" : ""}`}><i />{!telemetry ? "Sem sinal" : status.e_stop ? "Parada de emergência" : "Em operação"}</span>
          </div>

          <div className="section-rule"><span>ENERGIA</span><span className="section-rule-line" /></div>
          <div className="battery-block">
            <div className="battery-top"><span><Battery size={15} /> BATERIA</span><strong>{fmt(status.battery_percent, 1) ?? "--"}<small>{status.battery_percent == null ? "" : "%"}</small></strong></div>
            <div className="battery-track"><span style={{ width: `${Math.max(0, Math.min(100, Number(status.battery_percent) || 0))}%` }} /></div>
          </div>

          <div className="section-rule"><span>TELEMETRIA</span><span className="section-rule-line" /></div>
          <div className="metric-grid">
            <Metric icon={Gauge} label="Velocidade" value={fmt(status.speed_kmh)} unit=" km/h" accent="orange" />
            <Metric icon={Droplets} label="Umidade do solo" value={fmt(environment.soil_moisture_percent, 1)} unit="%" accent="blue" />
            <Metric icon={Thermometer} label="Temperatura" value={fmt(environment.ambient_temp_c, 1)} unit=" °C" accent="green" />
            <Metric icon={History} label="Leituras" value={history.length ? fmt(history.length, 0) : null} unit="" accent="slate" />
          </div>

          <div className="module-card">
            <div className="module-heading"><Waypoints size={15} /><span>MÓDULO ATIVO</span>{telemetry && <span className="module-live"><i /> ATIVO</span>}</div>
            <strong>{activeModule ? `${activeModule.code} · ${activeModule.fullName}` : status.active_module?.replaceAll("_", " ") ?? "Aguardando dados"}</strong>
            {moduleRows.map((row) => (
              <div className="module-details" key={row.key}><span>{row.label}</span><b>{row.value ?? "--"}<small>{row.value == null ? "" : row.unit}</small></b></div>
            ))}
          </div>

          <div className="panel-footer"><span><MapPin size={13} /> ALTITUDE</span><strong>{fmt(location.altitude_m, 1) ?? "--"}<small>{location.altitude_m == null ? "" : " m"}</small></strong><span className="footer-divider" /><span className="stream-label"><Radio size={13} /> {{ demo: "SIMULAÇÃO LOCAL", esp32: "MQTT PÚBLICO", aghub: "STREAM WS" }[source]}</span></div>
        </aside>
      </section>

      <section className="history-section" aria-labelledby="history-heading">
        <div className="history-section-head">
          <h2 id="history-heading">Histórico</h2>
          <span>{historyNote}</span>
        </div>
        <div className="history-grid">
          <HistoryChart title="Bateria" unit="%" points={batterySeries} color={BATTERY_COLOR} />
          <HistoryChart title="Umidade do solo" unit="%" points={moistureSeries} color={MOISTURE_COLOR} />
          <div className="history-card moisture-summary">
            <div className="history-head"><div><span className="history-title">Mapa de umidade</span><strong>{moistureStats ? fmt(moistureStats.mean, 1) : "--"}<small>{moistureStats ? "% média" : ""}</small></strong></div></div>
            <dl>
              <div><dt>Mais seco</dt><dd>{moistureStats ? `${fmt(moistureStats.min, 1)}%` : "--"}</dd></div>
              <div><dt>Mais úmido</dt><dd>{moistureStats ? `${fmt(moistureStats.max, 1)}%` : "--"}</dd></div>
              <div><dt>Área amostrada</dt><dd>{moistureStats ? `${fmt(moistureStats.area, 0)} m²` : "--"}</dd></div>
              <div><dt>Pontos no mapa</dt><dd>{cells.length ? fmt(cells.length, 0) : "--"}</dd></div>
            </dl>
            <button type="button" className="history-map-button" onClick={() => setMapLayer("moisture")} disabled={!cells.length}><Droplets size={14} /> Ver no mapa</button>
          </div>
        </div>
      </section>

      <footer className="bottom-bar"><span>AGBOT <b>SISTEMAS DE CAMPO</b></span><span>MONITORAMENTO IoT <i /> GIS EM TEMPO REAL</span><button type="button" onClick={() => window.location.reload()} title="Atualizar painel"><RotateCcw size={14} /> ATUALIZAR</button></footer>
    </main>
  );
}
