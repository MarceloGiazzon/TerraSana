// Detalhes do AgHub (estação central) no modo demonstração. Como o resto da
// simulação, é função do horário: ao vivo e retrospectiva usam o mesmo cálculo.
import { findModule } from "./modules.js";
import { agbotState, droneState, noise } from "./simulate.js";

const MIN = 60_000;
const HOUR = 60 * MIN;
const between = (min, max, n) => min + (max - min) * n;
const round = (value, digits = 1) => Number(value.toFixed(digits));

const WATER_CAPACITY_L = 500;
const SILO_CAPACITY_KG = 120;

function waterUsedL(day, tMs) {
  return day.agbot
    .filter((task) => task.module === "M05_IRRIGADOR" && tMs >= task.start)
    .reduce((sum, task) => sum + 20 * Math.min(1, (tMs - task.start) / (task.end - task.start)), 0);
}

function buildEvents(day, tMs) {
  const events = [];
  const label = (task) => (task.agent === "drone" ? "Infodrone" : "AgBot");
  const what = (task) => (task.agent === "drone" ? task.title : `${findModule(task.module)?.code} · ${task.title}`);
  day.all.forEach((task) => {
    if (task.start <= tMs) events.push({ t: task.start, kind: task.agent, level: "info", text: `${label(task)} saiu para ${what(task)}` });
    if (task.end <= tMs) events.push({ t: task.end, kind: task.agent, level: "ok", text: `${label(task)} concluiu ${what(task)} e voltou ${task.agent === "drone" ? "ao ninho" : "à doca"}` });
  });
  for (let h = Math.ceil(day.start / HOUR) * HOUR; h <= tMs; h += HOUR) {
    events.push({ t: h, kind: "hub", level: "ok", text: "Telemetria arquivada no SQLite (backup incremental)" });
  }
  events.push({ t: day.start - 8 * MIN, kind: "hub", level: "ok", text: "Relógio sincronizado (NTP) e correção RTK recebida" });
  return events.sort((a, b) => b.t - a.t).slice(0, 14);
}

export function hubDetails(day, tMs) {
  const n = (seed) => noise(seed, tMs);
  const agbot = agbotState(day, tMs);
  const drone = droneState(day, tMs);
  const agbotDocked = !agbot.task;
  const droneDocked = !drone.task;
  const agbotBattery = agbot.payload.status.battery_percent;

  // Energia
  const chargingAgbot = agbotDocked ? (agbotBattery < 99 ? 0.9 : 0.05) : 0;
  const chargingDrone = droneDocked ? (drone.battery < 99 ? 0.25 : 0.02) : 0;
  const loadKw = round(0.32 + between(0, 0.06, n(50)) + chargingAgbot + chargingDrone + (day.agbot.some((t) => t.module === "M07_COGUMELOS" && tMs >= t.start && tMs <= t.end) ? 0.18 : 0), 2);
  const power = {
    source: "Rede 220 V",
    voltage: round(between(217, 224, n(51)), 0),
    frequency: round(between(59.9, 60.1, n(52)), 2),
    loadKw,
    upsPercent: 100,
    upsAutonomyMin: 94,
    todayKwh: round(((tMs - (day.start - 8 * MIN)) / HOUR) * (loadKw * 0.9) + 1.8, 1),
  };

  // RTK / GNSS
  const sats = 14 + Math.round(n(40) * 4);
  const agbotSample = agbot.sample;
  const rtk = {
    fix: "RTK fixo",
    satellites: sats,
    hdop: round(between(0.6, 0.9, n(53)), 2),
    precisionCm: 2,
    correctionAgeS: round(between(0.8, 1.4, n(54)), 1),
    baselineM: agbotSample ? Math.round(Math.hypot(agbotSample.u + 23, agbotSample.v - 13)) : 11,
    constellations: "GPS · GLONASS · Galileo",
  };

  // Água
  const used = waterUsedL(day, tMs);
  const irrigating = day.agbot.some((t) => t.module === "M05_IRRIGADOR" && tMs >= t.start && tMs <= t.end);
  const waterL = Math.round(410 - used);
  const water = {
    liters: waterL,
    capacity: WATER_CAPACITY_L,
    percent: round((waterL / WATER_CAPACITY_L) * 100, 0),
    usedTodayL: round(used, 1),
    pump: irrigating ? "Bombeando" : "Em espera",
    pressureBar: irrigating ? round(between(2.5, 3.2, n(55)), 2) : 0,
    quality: { ph: round(between(6.7, 7.0, n(56)), 2), ec: round(between(0.32, 0.38, n(57)), 2) },
  };

  // Insumos
  const seeding = day.agbot.find((t) => t.module === "M02_SEMEADORA");
  const seedProgress = seeding ? Math.min(1, Math.max(0, (tMs - seeding.start) / (seeding.end - seeding.start))) : 0;
  const siloPercent = round(72 - seedProgress * 9, 0);
  const supplies = {
    seedsPercent: siloPercent,
    seedsKg: round((siloPercent / 100) * SILO_CAPACITY_KG, 1),
    fertilizerPercent: 64,
    fertilizerKg: round(0.64 * 200, 0),
  };

  // Computador / rede
  const compute = {
    cpu: Math.round(between(18, 34, n(41))),
    memory: Math.round(between(38, 46, n(58))),
    temperatureC: round(between(46, 53, n(59)), 0),
    disk: 23,
    uptime: "12 d 4 h",
  };
  const network = {
    ssid: "TerraSana-Campo",
    broker: "Mosquitto · online",
    backend: "FastAPI + WebSocket · online",
    latencyMs: Math.round(between(12, 28, n(60))),
    messagesPerMin: 60 + (agbotDocked ? 0 : 0) + Math.round(n(61) * 6),
    clients: [
      { name: "AgBot", online: true, rssi: agbotDocked ? -42 : Math.round(between(-71, -52, n(62))), note: agbotDocked ? "na doca" : "em campo" },
      { name: "Infodrone", online: true, rssi: droneDocked ? -44 : Math.round(between(-74, -55, n(63))), note: droneDocked ? "no ninho" : "em voo" },
      { name: "Painel", online: true, rssi: null, note: "navegador" },
    ],
  };

  // Estação meteorológica (no telhado do galpão)
  const hour = new Date(tMs).getHours() + new Date(tMs).getMinutes() / 60;
  const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
  const weather = {
    temperatureC: agbot.payload.environmental.ambient_temp_c,
    humidity: Math.round(between(52, 68, n(64))),
    windKmh: round(between(3, 11, n(65)), 0),
    windDir: ["N", "NE", "L", "SE", "S", "SO", "O", "NO"][Math.floor(n(66) * 8) % 8],
    rainMm: 0,
    solarWm2: Math.round(daylight * between(620, 780, n(67))),
    pressureHpa: round(between(925, 929, n(68)), 0),
  };

  // Câmara de cogumelos
  const chamber = {
    temperatureC: round(between(17.4, 19.2, n(69)), 1),
    humidity: round(between(87, 92, n(70)), 0),
    co2: Math.round(between(820, 1180, n(71))),
    fogger: n(72) > 0.7,
  };

  // Docas
  const docks = {
    agbot: { occupied: agbotDocked, battery: agbotBattery, chargingKw: round(chargingAgbot, 2), module: agbotDocked ? "módulos livres" : findModule(agbot.task.module)?.code },
    drone: { occupied: droneDocked, battery: drone.battery, chargingKw: round(chargingDrone, 2), lid: droneDocked ? "fechada" : "aberta" },
  };

  // Dados
  const sinceStart = Math.max(0, (tMs - (day.start - 8 * MIN)) / 1000);
  const data = {
    readingsToday: Math.round(sinceStart * 1.1),
    dbMb: round(184 + sinceStart * 0.0011, 1),
    lastBackup: Math.floor(tMs / HOUR) * HOUR,
    retention: "90 dias",
  };

  // Avisos
  const alerts = [];
  if (water.percent < 30) alerts.push({ level: "warn", text: `Reservatório baixo: ${water.percent}%` });
  if (supplies.seedsPercent < 40) alerts.push({ level: "warn", text: `Silo de sementes em ${supplies.seedsPercent}%` });
  if (agbotBattery < 30) alerts.push({ level: "warn", text: `Bateria do AgBot em ${Math.round(agbotBattery)}%` });
  if (drone.battery < 25) alerts.push({ level: "warn", text: `Bateria do Infodrone em ${Math.round(drone.battery)}%` });
  const nextAgbot = agbot.nextTask;
  const nextDrone = drone.nextTask;
  const nextIrrigation = day.agbot.find((t) => t.module === "M05_IRRIGADOR" && t.start > tMs);
  if (nextIrrigation) alerts.push({ level: "info", text: `Irrigação às ${new Date(nextIrrigation.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} usará cerca de 20 L do reservatório` });
  if (nextAgbot) alerts.push({ level: "info", text: `Troca de módulo na doca antes de ${findModule(nextAgbot.module)?.code} · ${nextAgbot.title}`, at: nextAgbot.start });
  if (nextDrone) alerts.push({ level: "info", text: `Próximo voo do Infodrone: ${nextDrone.title}`, at: nextDrone.start });

  return { agbot, drone, power, rtk, water, supplies, compute, network, weather, chamber, docks, data, alerts, events: buildEvents(day, tMs) };
}
