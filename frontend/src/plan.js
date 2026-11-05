// Agenda do dia no modo demonstração: tarefas do AgBot (um módulo por vez)
// e voos do Infodrone, com percursos coerentes com cada serviço.
import { BED_SPACING, PLACES, PLOTS, TREES, toLngLat } from "./farm.js";
import { buildTimeline } from "./simulate.js";

const MIN = 60_000;
const GAP_MS = 12 * MIN; // troca de módulo e recarga na doca entre tarefas
const [DOCK_U, DOCK_V] = PLACES.dock;
const ROAD = PLACES.roadV;

const wp = (u, v, extra = {}) => ({ u, v, z: 0, ...extra });

// Da doca até um ponto, pela estrada interna.
function goTo(u, v) {
  return [wp(DOCK_U, DOCK_V), wp(DOCK_U, ROAD), wp(u, ROAD), wp(u, v)];
}
function backToDock(from) {
  return [wp(from.u, ROAD), wp(DOCK_U, ROAD), wp(DOCK_U, DOCK_V)];
}

// Linhas de canteiro em serpentina pelos talhões indicados.
function bedRows(plotIds, offset) {
  const points = [];
  let upward = true;
  let east = true;
  plotIds.forEach((id) => {
    const plot = PLOTS[id - 1];
    const rows = [];
    for (let v = plot.v0 + offset; v < plot.v1; v += BED_SPACING * (offset > 1 ? 2 : 1)) rows.push(v);
    if (!upward) rows.reverse();
    rows.forEach((v) => {
      const [ua, ub] = east ? [plot.u0 - 0.6, plot.u1 + 0.6] : [plot.u1 + 0.6, plot.u0 - 0.6];
      points.push(wp(ua, v), wp(ub, v, { work: true }));
      east = !east;
    });
    upward = !upward;
  });
  return points;
}

function mowLawn() {
  const lanes = [];
  for (let u = -35, i = 0; u >= -75; u -= 1, i += 1) {
    const [va, vb] = i % 2 === 0 ? [9, 53] : [53, 9];
    lanes.push(wp(u, va), wp(u, vb, { work: true }));
  }
  const last = lanes[lanes.length - 1];
  return [...goTo(-35, 9), ...lanes, wp(last.u, 9), ...backToDock(wp(last.u, 9))];
}

function rowsTask(plotIds, offset) {
  const rows = bedRows(plotIds, offset);
  const first = rows[0];
  const last = rows[rows.length - 1];
  return [...goTo(first.u, 8), wp(first.u, first.v), ...rows.slice(1), wp(last.u, 8), ...backToDock(wp(last.u, 8))];
}

function soilSampling(plotIds) {
  const points = [];
  plotIds.forEach((id, plotIndex) => {
    const plot = PLOTS[id - 1];
    const width = plot.u0 - plot.u1;
    [0.2, 0.5, 0.8].forEach((f, col) => {
      const rows = [14, 26, 38, 50];
      if ((col + plotIndex) % 2) rows.reverse();
      rows.forEach((v) => points.push(wp(plot.u0 - width * f, v, { stop: 75 })));
    });
  });
  const last = points[points.length - 1];
  return [...goTo(points[0].u, 8), ...points, wp(last.u, 8), ...backToDock(wp(last.u, 8))];
}

function orchardHarvest() {
  const points = [];
  for (let i = 0; i < 5; i += 1) {
    const column = TREES.filter(([u]) => Math.abs(u - (-309 - 6 * i)) < 0.1).map(([u, v]) => wp(u + 3, v, { stop: 35 }));
    if (i % 2) column.reverse();
    points.push(...column);
  }
  const last = points[points.length - 1];
  return [...goTo(points[0].u, 8), ...points, wp(last.u, 8), ...backToDock(wp(last.u, 8))];
}

function mushroomChamber() {
  const [doorU, doorV] = PLACES.chamberDoor;
  const shelves = [-23, -24.3, -25.6, -26.9, -28.2, -29.5].map((u, i) => wp(u, PLACES.chamber.v, { stop: 150, fog: i % 2 === 0 }));
  return [wp(DOCK_U, DOCK_V), wp(DOCK_U, 19), wp(doorU, doorV), ...shelves, wp(doorU, doorV), wp(DOCK_U, 19), wp(DOCK_U, DOCK_V)];
}

const [NEST_U, NEST_V] = PLACES.nest;
function ndviFlight() {
  const alt = 35;
  const lanes = [];
  [12, 24, 36, 48].forEach((v, i) => {
    const [ua, ub] = i % 2 === 0 ? [-82, -300] : [-300, -82];
    lanes.push({ u: ua, v, z: alt }, { u: ub, v, z: alt, work: true });
  });
  return [{ u: NEST_U, v: NEST_V, z: 0 }, { u: NEST_U, v: NEST_V, z: alt }, ...lanes, { u: NEST_U, v: NEST_V, z: alt }, { u: NEST_U, v: NEST_V, z: 0 }];
}
function shiitakeMist() {
  const piles = PLACES.shiitake.map(([u, v]) => ({ u, v, z: 3, stop: 60 }));
  return [{ u: NEST_U, v: NEST_V, z: 0 }, { u: NEST_U, v: NEST_V, z: 15 }, { u: piles[0].u, v: piles[0].v, z: 15 }, ...piles, { u: piles[piles.length - 1].u, v: piles[piles.length - 1].v, z: 15 }, { u: NEST_U, v: NEST_V, z: 15 }, { u: NEST_U, v: NEST_V, z: 0 }];
}

const AGBOT_TASKS = [
  { key: "solo", module: "M03_SOLO_PROFUNDO", title: "Análise de solo", zone: "Horta · talhões 3 e 4", build: () => soilSampling([3, 4]), speeds: { workSpeed: 0.6, transitSpeed: 0.8 } },
  { key: "preparo", module: "M04_MOINHO_ROTATIVO", title: "Preparo de canteiros", zone: "Horta · talhão 5", build: () => rowsTask([5], 0.8), speeds: { workSpeed: 0.3, transitSpeed: 0.8 } },
  { key: "semeadura", module: "M02_SEMEADORA", title: "Semeadura de cenoura", zone: "Horta · talhão 5", build: () => rowsTask([5], 0.8), speeds: { workSpeed: 0.35, transitSpeed: 0.8 } },
  { key: "colheita", module: "M06_COLHEITA", title: "Colheita de frutas", zone: "Pomar", build: orchardHarvest, speeds: { workSpeed: 0.5, transitSpeed: 0.8 } },
  { key: "rocada", module: "M01_ROCADOR", title: "Roçada do gramado", zone: "Gramado", build: mowLawn, speeds: { workSpeed: 0.42, transitSpeed: 0.8 }, current: true },
  { key: "irrigacao", module: "M05_IRRIGADOR", title: "Irrigação da horta", zone: "Horta · talhões 1 e 2", build: () => rowsTask([1, 2], 1.6), speeds: { workSpeed: 0.35, transitSpeed: 0.8 } },
  { key: "cogumelos", module: "M07_COGUMELOS", title: "Climatização dos cogumelos", zone: "Câmara de cogumelos", build: mushroomChamber, speeds: { workSpeed: 0.3, transitSpeed: 0.3 } },
];

function makeTask(def, agent, id) {
  const waypoints = def.build();
  const timeline = buildTimeline(waypoints, def.speeds);
  return {
    id,
    agent,
    key: def.key,
    module: def.module ?? null,
    service: def.service ?? null,
    title: def.title,
    zone: def.zone,
    speeds: def.speeds,
    timeline,
    coords: waypoints.map(({ u, v }) => toLngLat(u, v)),
    durationMs: Math.round(timeline.duration * 1000),
  };
}

/** Monta a agenda do dia com a roçada em andamento no horário `now`. */
export function buildDay(now = Date.now()) {
  const t0 = Math.floor(now / MIN) * MIN;
  const agbot = AGBOT_TASKS.map((def, index) => makeTask(def, "agbot", `agbot-${def.key}`));
  const current = AGBOT_TASKS.findIndex((def) => def.current);

  agbot[current].start = t0 - 22 * MIN;
  for (let i = current - 1; i >= 0; i -= 1) agbot[i].start = agbot[i + 1].start - GAP_MS - agbot[i].durationMs;
  for (let i = current + 1; i < agbot.length; i += 1) agbot[i].start = agbot[i - 1].start + agbot[i - 1].durationMs + GAP_MS;
  agbot.forEach((task) => { task.end = task.start + task.durationMs; });

  const droneDefs = [
    { key: "shiitake-manha", service: "nebulizacao", title: "Nebulização do shiitake", zone: "Mata úmida", build: shiitakeMist, speeds: { workSpeed: 2, transitSpeed: 4 }, start: agbot[0].start + 15 * MIN },
    { key: "ndvi", service: "ndvi", title: "Reconhecimento NDVI", zone: "Horta", build: ndviFlight, speeds: { workSpeed: 2.5, transitSpeed: 4 }, start: t0 - 4 * MIN },
    { key: "shiitake-tarde", service: "nebulizacao", title: "Nebulização do shiitake", zone: "Mata úmida", build: shiitakeMist, speeds: { workSpeed: 2, transitSpeed: 4 }, start: agbot[agbot.length - 1].start + 5 * MIN },
  ];
  const drone = droneDefs.map((def) => {
    const task = makeTask(def, "drone", `drone-${def.key}`);
    task.start = def.start;
    task.end = task.start + task.durationMs;
    return task;
  });

  // Bateria do AgBot ao longo do dia: descarrega em tarefa, recarrega na doca.
  let battery = 96;
  agbot.forEach((task, index) => {
    task.batteryStart = battery;
    task.drainPerMin = task.module === "M07_COGUMELOS" ? 0.12 : 0.22;
    battery = Math.max(20, battery - (task.durationMs / MIN) * task.drainPerMin);
    task.batteryEnd = battery;
    if (index < agbot.length - 1) battery = Math.min(100, battery + (GAP_MS / MIN) * 0.9);
  });
  drone.forEach((task) => { task.batteryStart = 100; task.drainPerMin = 55 / (task.durationMs / MIN); });

  const all = [...agbot, ...drone].sort((a, b) => a.start - b.start);
  return { agbot, drone, all, start: Math.min(...all.map((task) => task.start)), end: Math.max(...all.map((task) => task.end)) };
}
