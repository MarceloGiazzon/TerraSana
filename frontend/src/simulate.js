// Motor determinístico do modo demonstração: o estado de cada agente é uma
// função do horário. Por isso o "ao vivo" e a retrospectiva usam o mesmo
// cálculo, e dá para avançar e voltar no tempo livremente.
import { PLACES, toLngLat } from "./farm.js";

const MIN = 60_000;

// ---------- Ruído determinístico ----------
function hash(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
/** Ruído suave em [0, 1], que varia a cada ~8 s. */
export function noise(seed, tMs) {
  const s = tMs / 8000;
  const i = Math.floor(s);
  const k = s - i;
  const a = hash(seed * 1013 + i);
  const b = hash(seed * 1013 + i + 1);
  return a + (b - a) * (k * k * (3 - 2 * k));
}
const between = (min, max, n) => min + (max - min) * n;
const round = (value, digits = 1) => Number(value.toFixed(digits));

// ---------- Percurso no tempo ----------
export function buildTimeline(waypoints, { workSpeed, transitSpeed }) {
  const segs = [];
  let t = 0;
  let workDist = 0;
  let workTime = 0;
  let stops = 0;
  let dist = 0;
  const stopPoints = [];
  for (let i = 1; i < waypoints.length; i += 1) {
    const a = waypoints[i - 1];
    const b = waypoints[i];
    const len = Math.hypot(b.u - a.u, b.v - a.v, (b.z ?? 0) - (a.z ?? 0));
    const dur = len / (b.work ? workSpeed : transitSpeed);
    if (dur > 0) {
      segs.push({ type: "move", t0: t, t1: t + dur, a, b, ai: i - 1, work: Boolean(b.work), len, dist0: dist, workDist0: workDist, workTime0: workTime, stops0: stops });
      t += dur;
      dist += len;
      if (b.work) { workDist += len; workTime += dur; }
    }
    if (b.stop) {
      segs.push({ type: "stop", t0: t, t1: t + b.stop, a: b, b, ai: i, work: true, len: 0, dist0: dist, workDist0: workDist, workTime0: workTime, stops0: stops, stopIndex: stops });
      stopPoints.push(b);
      t += b.stop;
      workTime += b.stop;
      stops += 1;
    }
  }
  return { segs, duration: t, waypoints, stopPoints, workDist };
}

export function sampleTimeline(timeline, elapsedS) {
  const { segs, waypoints } = timeline;
  if (!segs.length) return { ...waypoints[0], seg: null, ai: 0, work: false, moving: false, workDist: 0, workTime: 0, stopsDone: 0 };
  const e = Math.min(Math.max(elapsedS, 0), timeline.duration);
  let lo = 0;
  let hi = segs.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (segs[mid].t0 <= e) lo = mid; else hi = mid - 1;
  }
  const seg = segs[lo];
  const k = seg.t1 > seg.t0 ? Math.min(1, (e - seg.t0) / (seg.t1 - seg.t0)) : 1;
  const u = seg.a.u + (seg.b.u - seg.a.u) * k;
  const v = seg.a.v + (seg.b.v - seg.a.v) * k;
  const z = (seg.a.z ?? 0) + ((seg.b.z ?? 0) - (seg.a.z ?? 0)) * k;
  const finished = e >= timeline.duration;
  return {
    u, v, z, seg, ai: seg.ai, k,
    work: seg.work && !finished,
    moving: seg.type === "move" && !finished,
    stopping: seg.type === "stop" && !finished,
    distance: seg.dist0 + (seg.type === "move" ? seg.len * k : 0),
    workDist: seg.workDist0 + (seg.type === "move" && seg.work ? seg.len * k : 0),
    workTime: seg.workTime0 + (seg.work ? e - seg.t0 : 0),
    stopsDone: seg.stops0 + (seg.type === "stop" && finished ? 1 : 0),
    stopIndex: seg.stopIndex,
    heading: Math.atan2(seg.b.v - seg.a.v, seg.b.u - seg.a.u),
  };
}

/** Percurso já realizado até `elapsedS`, em [lng, lat]. */
export function performedPath(task, elapsedS) {
  const sample = sampleTimeline(task.timeline, elapsedS);
  return [...task.coords.slice(0, sample.ai + 1), toLngLat(sample.u, sample.v)];
}

// ---------- Ambiente ----------
export function soilMoistureAt(u, v, tMs) {
  const west = Math.min(1, Math.max(0, -u / 372));
  const pond = Math.hypot(u + 356, v - 13);
  const base = 29 + 9 * west + 4 * Math.sin((v / 57) * Math.PI * 1.3 + u / 60) + 2.5 * Math.cos(u / 23) + 8 * Math.exp(-pond / 30);
  return round(base + (noise(Math.round(u * 7 + v * 13), tMs) - 0.5) * 2);
}
function ambientTemp(tMs) {
  const hour = new Date(tMs).getHours() + new Date(tMs).getMinutes() / 60;
  return round(20 + 4 * Math.sin(((hour - 9) / 24) * Math.PI * 2) + (noise(3, tMs) - 0.5));
}

// ---------- Métricas de cada módulo ----------
function moduleTelemetry(task, s, tMs) {
  const n = (k) => noise(k + task.start / 1000, tMs);
  const at = (point) => soilMoistureAt(point.u, point.v, task.start);
  switch (task.module) {
    case "M01_ROCADOR":
      return { blade_rpm: s.work ? Math.round(between(2850, 3150, n(1))) : 0, blade_current_amp: round(s.work ? between(4, 9, n(2)) : 0.3), cut_height_mm: 60, area_cut_m2: round(s.workDist * 1.0) };
    case "M02_SEMEADORA": {
      const seeds = Math.floor(s.workDist / 0.05);
      return { seeds_planted: seeds, seed_spacing_cm: 5, hopper_level_percent: round(Math.max(0, 100 - (seeds / 26000) * 100)), fertilizer_g_m: round(s.work ? between(8, 12, n(3)) : 0) };
    }
    case "M03_SOLO_PROFUNDO": {
      const index = s.stopping ? s.stopIndex : s.stopsDone - 1;
      const point = task.timeline.stopPoints[index];
      const depth = s.stopping ? round(30 * Math.sin(Math.PI * s.k)) : 0;
      if (!point) return { samples_collected: 0, probe_depth_cm: depth };
      const h = (k) => hash(index * 31 + k);
      return {
        samples_collected: s.stopsDone,
        nitrogen_mg_kg: round(18 + 0.35 * at(point) + 8 * h(1)),
        phosphorus_mg_kg: round(9 + 14 * h(2)),
        potassium_mg_kg: round(85 + 70 * h(3)),
        ph: round(5.7 + 0.9 * h(4), 2),
        probe_depth_cm: depth,
      };
    }
    case "M04_MOINHO_ROTATIVO":
      return { motor_current_amp: round(s.work ? between(12, 24.5, n(4)) : 1.2), soil_resistance_index: round(s.work ? between(3, 7.5, n(5)) : 0, 2), depth_cm: s.work ? 8 : 0 };
    case "M05_IRRIGADOR": {
      const applied = s.workTime / 60 * 0.4;
      return { tank_level_percent: round(Math.max(0, 100 - (applied / 20) * 100)), flow_lpm: round(s.work ? between(0.3, 0.5, n(6)) : 0, 2), pressure_bar: round(s.work ? between(2.5, 3.2, n(7)) : 0, 2), applied_l: round(applied, 2) };
    }
    case "M06_COLHEITA": {
      let harvested = 0;
      for (let i = 0; i < s.stopsDone; i += 1) harvested += 1 + Math.floor(hash(i * 17) * 3);
      return { harvested_count: harvested, detection_confidence_percent: s.stopping ? round(between(86, 98, n(8))) : null, grip_force_n: s.stopping && s.k > 0.4 ? round(between(3, 6, n(9))) : null, cycle_time_s: round(between(7, 11, n(10))) };
    }
    case "M07_COGUMELOS": {
      const inside = s.u <= PLACES.chamber.u1 + 0.5;
      return { co2_ppm: Math.round(inside ? between(800, 1300, n(11)) : between(420, 480, n(11))), air_humidity_percent: round(inside ? between(85, 94, n(12)) : between(60, 72, n(12))), air_temp_c: round(inside ? between(17, 20, n(13)) : ambientTemp(tMs)), fogger_on: Boolean(s.stopping && s.seg?.a.fog) };
    }
    default:
      return {};
  }
}

// ---------- Estado dos agentes ----------
function activeTask(tasks, tMs) {
  return tasks.find((task) => tMs >= task.start && tMs <= task.end) ?? null;
}

export function agbotBattery(day, tMs) {
  let previous = null;
  for (const task of day.agbot) {
    if (tMs < task.start) {
      if (!previous) return task.batteryStart;
      return Math.min(100, previous.batteryEnd + ((tMs - previous.end) / MIN) * 0.9);
    }
    if (tMs <= task.end) return task.batteryStart - ((tMs - task.start) / MIN) * task.drainPerMin;
    previous = task;
  }
  return Math.min(100, previous.batteryEnd + ((tMs - previous.end) / MIN) * 0.9);
}

/** Telemetria do AgBot no formato publicado pelo simulador e pelo firmware. */
export function agbotState(day, tMs) {
  const task = activeTask(day.agbot, tMs);
  const nextTask = day.agbot.find((item) => item.start > tMs) ?? null;
  const battery = agbotBattery(day, tMs);
  if (!task) {
    const [u, v] = PLACES.dock;
    const [lng, lat] = toLngLat(u, v);
    return {
      task: null,
      nextTask,
      phase: nextTask ? "Na doca · troca de módulo" : "Na doca · recarregando",
      payload: {
        robot_id: "agbot_prototipo_v1",
        timestamp: Math.floor(tMs / 1000),
        location: { latitude: round(lat, 6), longitude: round(lng, 6), altitude_m: 750.2 },
        status: { battery_percent: round(battery, 2), active_module: null, speed_kmh: 0, e_stop: false },
        module_telemetry: {},
        environmental: { soil_moisture_percent: soilMoistureAt(u, v, tMs), ambient_temp_c: ambientTemp(tMs) },
      },
    };
  }
  const s = sampleTimeline(task.timeline, (tMs - task.start) / 1000);
  const [lng, lat] = toLngLat(s.u, s.v);
  const speed = s.moving ? (s.work ? task.speeds.workSpeed : task.speeds.transitSpeed) * 3.6 * between(0.94, 1.06, noise(20, tMs)) : 0;
  return {
    task,
    nextTask,
    sample: s,
    phase: s.stopping ? "Parado no ponto de trabalho" : s.work ? "Trabalhando" : "Em deslocamento",
    payload: {
      robot_id: "agbot_prototipo_v1",
      timestamp: Math.floor(tMs / 1000),
      location: { latitude: round(lat, 6), longitude: round(lng, 6), altitude_m: 750.2 },
      status: { battery_percent: round(battery, 2), active_module: task.module, speed_kmh: round(speed, 2), e_stop: false },
      module_telemetry: moduleTelemetry(task, s, tMs),
      environmental: { soil_moisture_percent: soilMoistureAt(s.u, s.v, tMs), ambient_temp_c: ambientTemp(tMs) },
    },
  };
}

export function droneState(day, tMs) {
  const task = activeTask(day.drone, tMs);
  const nextTask = day.drone.find((item) => item.start > tMs) ?? null;
  if (!task) {
    const [lng, lat] = toLngLat(...PLACES.nest);
    const last = [...day.drone].reverse().find((item) => item.end < tMs);
    const battery = last ? Math.min(100, last.batteryStart - (last.durationMs / MIN) * last.drainPerMin + ((tMs - last.end) / MIN) * 2.5) : 100;
    return { task: null, nextTask, lngLat: [lng, lat], altitude: 0, battery: round(battery), speed: 0, phase: "No ninho · carregando" };
  }
  const s = sampleTimeline(task.timeline, (tMs - task.start) / 1000);
  const verticalOnly = s.seg && s.seg.a.u === s.seg.b.u && s.seg.a.v === s.seg.b.v && s.seg.type === "move";
  const phase = s.stopping ? (task.key.startsWith("shiitake") ? "Nebulizando as toras" : "Pairando") : verticalOnly ? (s.seg.b.z > s.seg.a.z ? "Decolando" : "Pousando") : s.work ? "Mapeando" : "Em voo";
  return {
    task,
    nextTask,
    sample: s,
    lngLat: toLngLat(s.u, s.v),
    altitude: round(s.z),
    battery: round(task.batteryStart - ((tMs - task.start) / MIN) * task.drainPerMin),
    speed: round(s.moving ? (s.work ? task.speeds.workSpeed : task.speeds.transitSpeed) * 3.6 : 0),
    phase,
  };
}

export function hubState(day, tMs) {
  const irrigation = day.agbot.find((task) => task.module === "M05_IRRIGADOR");
  const seeding = day.agbot.find((task) => task.module === "M02_SEMEADORA");
  const waterUsed = irrigation && tMs >= irrigation.start ? 20 : 0;
  const seedProgress = seeding ? Math.min(1, Math.max(0, (tMs - seeding.start) / (seeding.end - seeding.start))) : 0;
  const agbot = activeTask(day.agbot, tMs);
  const drone = activeTask(day.drone, tMs);
  return {
    grid: "220 V",
    rtk: `RTK fixo · ${14 + Math.round(noise(40, tMs) * 4)} satélites`,
    water: round(((410 - waterUsed) / 500) * 100),
    silo: round(72 - seedProgress * 9),
    cpu: Math.round(between(18, 34, noise(41, tMs))),
    docked: [!agbot && "AgBot", !drone && "Infodrone"].filter(Boolean),
  };
}

// ---------- Séries para gráficos e mapa de umidade ----------
const SAMPLE_STEP_S = 5;
export function taskSamples(day, task) {
  if (task._samples) return task._samples;
  const samples = [];
  const steps = Math.ceil(task.timeline.duration / SAMPLE_STEP_S);
  for (let i = 0; i <= steps; i += 1) {
    const tMs = task.start + Math.min(task.durationMs, i * SAMPLE_STEP_S * 1000);
    const s = sampleTimeline(task.timeline, (tMs - task.start) / 1000);
    const [lng, lat] = toLngLat(s.u, s.v);
    samples.push({
      t: tMs,
      lat,
      lng,
      work: s.work,
      battery: task.agent === "agbot" ? agbotBattery(day, tMs) : task.batteryStart - ((tMs - task.start) / MIN) * task.drainPerMin,
      moisture: task.agent === "agbot" ? soilMoistureAt(s.u, s.v, tMs) : NaN,
      altitude: s.z,
    });
  }
  task._samples = samples;
  return samples;
}
