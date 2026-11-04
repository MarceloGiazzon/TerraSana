import { useCallback, useEffect, useRef, useState } from "react";
import Map, { Layer, Marker, NavigationControl, ScaleControl, Source } from "react-map-gl/maplibre";
import { MapContainer, Marker as LeafletMarker, Polygon as LeafletPolygon, Polyline as LeafletPolyline, ScaleControl as LeafletScaleControl, TileLayer, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import { Activity, Battery, Bot, Crosshair, Droplets, Gauge, MapPin, Mountain, Radio, RotateCcw, Waypoints, Wind } from "lucide-react";
import areaJson from "../../data/area.geojson?raw";

const defaultLocation = { latitude: -29.116169, longitude: -51.224389 };
const mapStyle = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const maxTrailPoints = 240;
const area = JSON.parse(areaJson);
const areaPositions = area.features[0].geometry.coordinates[0].map(([longitude, latitude]) => [latitude, longitude]);
const robotIcon = L.divIcon({
  className: "leaflet-robot-icon",
  html: '<span class="leaflet-robot-pulse"></span><span class="leaflet-robot-core"></span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function RasterMapRef({ mapRef }) {
  const leafletMap = useMap();

  useEffect(() => {
    mapRef.current = leafletMap;
    return () => { mapRef.current = null; };
  }, [leafletMap, mapRef]);

  return null;
}

const field = { latMin: -29.116392, latMax: -29.115946, lngMin: -51.227988, lngMax: -51.224489 };
const forceDemo = new URLSearchParams(window.location.search).has("demo");
const staticHost = !["localhost", "127.0.0.1"].includes(window.location.hostname) && !import.meta.env.VITE_WS_URL;

// Gera telemetria localmente, com o mesmo padrão de varredura do simulador Python.
function createDemoSimulator(onData) {
  let latitude = -29.116169;
  let longitude = -51.2245;
  let lngDir = -1;
  let latDir = 1;
  let battery = 100;
  const rand = (min, max) => Math.round((min + Math.random() * (max - min)) * 100) / 100;
  function tick() {
    longitude += lngDir * 0.00004;
    if (longitude <= field.lngMin || longitude >= field.lngMax) {
      longitude = Math.min(field.lngMax, Math.max(field.lngMin, longitude));
      lngDir *= -1;
      let next = latitude + latDir * 0.00008;
      if (next > field.latMax || next < field.latMin) { latDir *= -1; next = latitude + latDir * 0.00008; }
      latitude = next;
    }
    battery = Math.max(0, battery - 0.02);
    onData({
      robot_id: "agbot_prototipo_v1",
      timestamp: Math.floor(Date.now() / 1000),
      location: { latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)), altitude_m: 750.2 },
      status: { battery_percent: Number(battery.toFixed(2)), active_module: "M04_MOINHO_ROTATIVO", speed_kmh: rand(1.2, 2.5), e_stop: false },
      telemetry_m04: { motor_current_amp: rand(12, 24.5), depth_cm: 8, soil_resistance_index: rand(3, 7.5) },
      environmental: { soil_moisture_percent: rand(28, 42), ambient_temp_c: 21.5 },
    });
  }
  tick();
  const timer = window.setInterval(tick, 1000);
  return () => window.clearInterval(timer);
}

function websocketUrl() {
  const configuredUrl = import.meta.env.VITE_WS_URL;
  if (configuredUrl) return configuredUrl;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:8010/ws/telemetry`;
}

function formatTime(timestamp) {
  if (!timestamp) return "Aguardando sinal";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp * 1000));
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
  const [telemetry, setTelemetry] = useState(null);
  const [connection, setConnection] = useState("connecting");
  const [trail, setTrail] = useState([]);
  const [map, setMap] = useState(null);
  const [viewMode, setViewMode] = useState("2d");
  const rasterMap = useRef(null);
  const [supportsWebGL2] = useState(() => Boolean(document.createElement("canvas").getContext("webgl2")));

  const handleTelemetry = useCallback((next) => {
    const latitude = Number(next.location?.latitude);
    const longitude = Number(next.location?.longitude);
    setTelemetry(next);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      setTrail((points) => {
        const last = points[points.length - 1];
        if (last && last[0] === longitude && last[1] === latitude) return points;
        return [...points, [longitude, latitude]].slice(-maxTrailPoints);
      });
    }
  }, []);

  useEffect(() => {
    if (connection !== "demo") return undefined;
    return createDemoSimulator(handleTelemetry);
  }, [connection, handleTelemetry]);

  useEffect(() => {
    if (forceDemo || staticHost) {
      setConnection("demo");
      return undefined;
    }
    let socket;
    let failures = 0;
    let reconnectTimer;
    let initialConnectTimer;
    let reconnectDelay = 2500;
    let disposed = false;

    function connect() {
      if (disposed) return;
      setConnection("connecting");
      socket = new WebSocket(websocketUrl());

      socket.onopen = () => {
        reconnectDelay = 2500;
        failures = 0;
        setConnection("connected");
      };
      socket.onmessage = (event) => {
        try {
          handleTelemetry(JSON.parse(event.data));
        } catch {
          setConnection("error");
        }
      };
      socket.onerror = () => setConnection("error");
      socket.onclose = () => {
        if (!disposed) {
          failures += 1;
          // Sem backend local após algumas tentativas: cai para o modo demonstração.
          if (failures >= 3) {
            disposed = true;
            setConnection("demo");
            return;
          }
          setConnection("reconnecting");
          reconnectTimer = window.setTimeout(connect, reconnectDelay);
          reconnectDelay = Math.min(reconnectDelay * 2, 30000);
        }
      };
    }

    initialConnectTimer = window.setTimeout(connect, 0);
    return () => {
      disposed = true;
      window.clearTimeout(initialConnectTimer);
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [handleTelemetry]);

  const location = telemetry?.location ?? defaultLocation;
  const status = telemetry?.status ?? {};
  const motor = telemetry?.telemetry_m04 ?? {};
  const environment = telemetry?.environmental ?? {};
  const trailData = {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: trail },
  };
  const connectionText = {
    connected: "Conectado",
    connecting: "Conectando",
    reconnecting: "Reconectando",
    error: "Instável",
    demo: "Modo demonstração",
  }[connection];

  function centerRobot() {
    map?.flyTo({ center: [location.longitude, location.latitude], zoom: 17, pitch: viewMode === "3d" ? 60 : 0, duration: 900 });
    rasterMap.current?.flyTo([location.latitude, location.longitude], 17, { duration: 0.9 });
  }

  function changeViewMode(mode) {
    setViewMode(mode);
    map?.easeTo({ pitch: mode === "3d" ? 62 : 0, bearing: mode === "3d" ? 18 : 0, duration: 900 });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href={import.meta.env.DEV ? "#inicio" : "../index.html"} aria-label="Terra Sana, voltar ao site">
          <span className="brand-mark"><Bot size={21} strokeWidth={1.8} /></span>
          <span className="brand-name">AG<span>BOT</span><small>SISTEMAS DE CAMPO</small></span>
        </a>
        <div className="topbar-center"><span className="workspace-label">OPERAÇÃO DE CAMPO</span><span className="workspace-divider" /><span className="workspace-location"><MapPin size={14} /> Estr. Ver. Marcial Pisoni · Linha 40</span></div>
        <div className={`connection-state ${connection}`}><span className="connection-dot" /><Radio size={15} />{connectionText}</div>
      </header>

      <section className="page-heading" id="inicio">
        <div>
          <p className="eyebrow">CENTRO DE CONTROLE <span> / </span> UNIDADE 01</p>
          <h1>Monitoramento <em>ao vivo</em></h1>
        </div>
        <div className="last-update"><Activity size={15} /><span>ÚLTIMA TELEMETRIA</span><strong>{formatTime(telemetry?.timestamp)}</strong></div>
      </section>

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
              <Source
                id="terrain-dem"
                type="raster-dem"
                tiles={["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"]}
                encoding="terrarium"
                tileSize={256}
                maxzoom={15}
              />
              <Source id="field-boundary" type="geojson" data={area}>
                <Layer id="field-fill" type="fill" paint={{ "fill-color": "#719c53", "fill-opacity": 0.12 }} />
                <Layer id="field-outline" type="line" paint={{ "line-color": "#568044", "line-width": 2, "line-dasharray": [2, 2] }} />
              </Source>
              {trail.length > 1 && (
                <Source id="robot-trail" type="geojson" data={trailData}>
                  <Layer id="trail-shadow" type="line" paint={{ "line-color": "#fffefa", "line-width": 7, "line-opacity": 0.9 }} />
                  <Layer id="trail-line" type="line" paint={{ "line-color": "#d4673e", "line-width": 3, "line-opacity": 0.9 }} />
                </Source>
              )}
              <Marker latitude={location.latitude} longitude={location.longitude} anchor="center">
                <div className="robot-marker" aria-label="Posição atual do AgBot"><span className="marker-pulse" /><Bot size={19} strokeWidth={2} /></div>
              </Marker>
              <NavigationControl position="top-right" showCompass={false} />
              <ScaleControl position="bottom-left" />
            </Map>
          ) : (
            <MapContainer
              className="raster-map"
              center={[defaultLocation.latitude, defaultLocation.longitude]}
              zoom={16}
              zoomControl={false}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={import.meta.env.DEV ? "/tiles/{z}/{x}/{y}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
              />
              <LeafletPolygon positions={areaPositions} pathOptions={{ color: "#568044", weight: 2, dashArray: "6 5", fillColor: "#719c53", fillOpacity: 0.12 }} />
              {trail.length > 1 && <LeafletPolyline positions={trail.map(([longitude, latitude]) => [latitude, longitude])} pathOptions={{ color: "#d4673e", weight: 3 }} />}
              <LeafletMarker position={[location.latitude, location.longitude]} icon={robotIcon} />
              <ZoomControl position="topright" />
              <LeafletScaleControl position="bottomleft" />
              <RasterMapRef mapRef={rasterMap} />
            </MapContainer>
          )}
          <div className="map-mode-toggle" role="group" aria-label="Modo de visualização do mapa">
            <button type="button" className={viewMode === "2d" ? "selected" : ""} aria-pressed={viewMode === "2d"} onClick={() => changeViewMode("2d")}>2D</button>
            <button type="button" className={viewMode === "3d" ? "selected" : ""} aria-pressed={viewMode === "3d"} disabled={!supportsWebGL2} title={supportsWebGL2 ? "Ver terreno em 3D" : "3D requer WebGL2, indisponível neste navegador"} onClick={() => changeViewMode("3d")}><Mountain size={14} /> 3D</button>
          </div>
          <div className="map-overlay map-title"><span className="live-indicator" /> POSIÇÃO DO ROBÔ <span className="map-coordinate">{location.latitude.toFixed(5)}°, {location.longitude.toFixed(5)}°</span></div>
          <button className="map-center" type="button" onClick={centerRobot} aria-label="Centralizar no robô" title="Centralizar no robô"><Crosshair size={18} /></button>
          <div className="map-legend"><span className="legend-field" /> Limite da propriedade <span className="legend-trail" /> Percurso</div>
        </div>

        <aside className="telemetry-panel">
          <div className="robot-card">
            <div className="robot-avatar"><Bot size={24} strokeWidth={1.7} /></div>
            <div className="robot-identity"><span>UNIDADE MÓVEL</span><h2>AgBot Protótipo</h2><small>{telemetry?.robot_id ?? "agbot_prototipo_v1"}</small></div>
            <span className={`robot-state ${status.e_stop ? "alert" : ""}`}><i />{status.e_stop ? "Parado" : "Em operação"}</span>
          </div>

          <div className="section-rule"><span>ENERGIA</span><span className="section-rule-line" /></div>
          <div className="battery-block">
            <div className="battery-top"><span><Battery size={15} /> BATERIA</span><strong>{status.battery_percent ?? "--"}<small>{status.battery_percent == null ? "" : "%"}</small></strong></div>
            <div className="battery-track"><span style={{ width: `${Math.max(0, Math.min(100, Number(status.battery_percent) || 0))}%` }} /></div>
          </div>

          <div className="section-rule"><span>TELEMETRIA</span><span className="section-rule-line" /></div>
          <div className="metric-grid">
            <Metric icon={Gauge} label="Velocidade" value={status.speed_kmh} unit=" km/h" accent="orange" />
            <Metric icon={Activity} label="Corrente M04" value={motor.motor_current_amp} unit=" A" accent="green" />
            <Metric icon={Droplets} label="Umidade do solo" value={environment.soil_moisture_percent} unit="%" accent="blue" />
            <Metric icon={Wind} label="Resistência do solo" value={motor.soil_resistance_index} unit=" idx" accent="slate" />
          </div>

          <div className="module-card">
            <div className="module-heading"><Waypoints size={15} /><span>MÓDULO ATIVO</span><span className="module-live"><i /> ATIVO</span></div>
            <strong>{status.active_module?.replaceAll("_", " ") ?? "Aguardando dados"}</strong>
            <div className="module-details"><span>Profundidade de trabalho</span><b>{motor.depth_cm ?? "--"}<small>{motor.depth_cm == null ? "" : " cm"}</small></b></div>
          </div>

          <div className="panel-footer"><span><MapPin size={13} /> ALTITUDE</span><strong>{location.altitude_m ?? "--"}<small>{location.altitude_m == null ? "" : " m"}</small></strong><span className="footer-divider" /><span className="stream-label"><Radio size={13} /> {connection === "demo" ? "SIMULAÇÃO LOCAL" : "STREAM WS"}</span></div>
        </aside>
      </section>

      <footer className="bottom-bar"><span>AGBOT <b>SISTEMAS DE CAMPO</b></span><span>MONITORAMENTO IoT <i /> GIS EM TEMPO REAL</span><button type="button" onClick={() => window.location.reload()} title="Atualizar painel"><RotateCcw size={14} /> ATUALIZAR</button></footer>
    </main>
  );
}