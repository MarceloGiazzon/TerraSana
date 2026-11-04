import { MODULES } from "./modules.js";

// Simulador local do modo demonstração: mesmo padrão de varredura e mesmos
// módulos do simulador Python (simulation/telemetry_engine.py).
export const field = { latMin: -29.116392, latMax: -29.115946, lngMin: -51.227988, lngMax: -51.224489 };

const LNG_STEP = 0.00004;
const LAT_STEP = 0.00008;
const METERS_PER_LNG_DEG = 111320 * Math.cos((29.116 * Math.PI) / 180);
const rand = (min, max, digits = 1) => Number((min + Math.random() * (max - min)).toFixed(digits));

export function soilMoisture(latitude, longitude) {
  const x = (longitude - field.lngMin) / (field.lngMax - field.lngMin);
  const y = (latitude - field.latMin) / (field.latMax - field.latMin);
  const base = 38 - 10 * x + 4 * Math.sin(y * Math.PI * 1.5) + 3 * Math.cos(x * Math.PI * 3);
  return Number((base + (Math.random() * 2.4 - 1.2)).toFixed(1));
}

function freshCounters() {
  return { areaCut: 0, seeds: 0, hopper: 100, applied: 0, harvested: 0 };
}

const builders = {
  M01_ROCADOR: (c, ctx) => {
    c.areaCut += ctx.distance * 0.45;
    return { blade_rpm: Math.round(rand(2850, 3150, 0)), cut_height_mm: 60, blade_current_amp: rand(4, 9), area_cut_m2: Number(c.areaCut.toFixed(1)) };
  },
  M02_SEMEADORA: (c, ctx) => {
    c.seeds += Math.max(1, Math.floor(ctx.distance / 0.25));
    c.hopper = Math.max(0, c.hopper - 0.08);
    return { seeds_planted: c.seeds, seed_spacing_cm: 25, hopper_level_percent: Number(c.hopper.toFixed(1)), fertilizer_g_m: rand(8, 12) };
  },
  M03_SOLO_PROFUNDO: (c, ctx) => ({
    nitrogen_mg_kg: rand(20 + ctx.moisture * 0.3, 32 + ctx.moisture * 0.3),
    phosphorus_mg_kg: rand(8, 25),
    potassium_mg_kg: rand(80, 160),
    ph: rand(5.6, 6.8, 2),
    probe_depth_cm: 30,
  }),
  M04_MOINHO_ROTATIVO: () => ({ motor_current_amp: rand(12, 24.5), depth_cm: 8, soil_resistance_index: rand(3, 7.5, 2) }),
  M05_IRRIGADOR: (c) => {
    const flow = rand(0.8, 1.6, 2);
    c.applied += flow / 60;
    return { tank_level_percent: Number(Math.max(0, 100 - (c.applied / 20) * 100).toFixed(1)), flow_lpm: flow, pressure_bar: rand(2.5, 3.2, 2), applied_l: Number(c.applied.toFixed(2)) };
  },
  M06_COLHEITA: (c) => {
    if (Math.random() < 0.35) c.harvested += 1;
    return { harvested_count: c.harvested, grip_force_n: rand(3, 6), detection_confidence_percent: rand(86, 98), cycle_time_s: rand(7, 11) };
  },
  M07_COGUMELOS: () => ({ co2_ppm: Math.round(rand(700, 1400, 0)), air_humidity_percent: rand(85, 94), air_temp_c: rand(17, 21), fogger_on: Math.random() < 0.4 }),
};

/**
 * @param {object} options
 * @param {(payload: object) => void} options.onData  leitura nova (a cada intervalo)
 * @param {(payloads: object[]) => void} options.onPrefill  histórico inicial gerado de uma vez
 */
export function createDemoSimulator({ onData, onPrefill, prefill = 600, intervalMs = 1000, rotationMs = 60000 }) {
  let latitude = -29.116169;
  let longitude = -51.2245;
  let lngDir = -1;
  let latDir = 1;
  let battery = 97;
  let moduleIndex = 3; // começa no M04, como o protótipo físico
  let counters = freshCounters();
  let lastSwitch = Date.now();

  function selectModule(index) {
    if (index === moduleIndex) return;
    moduleIndex = index;
    counters = freshCounters();
  }

  function step(timestampMs) {
    longitude += lngDir * LNG_STEP;
    if (longitude <= field.lngMin || longitude >= field.lngMax) {
      longitude = Math.min(field.lngMax, Math.max(field.lngMin, longitude));
      lngDir *= -1;
      let next = latitude + latDir * LAT_STEP;
      if (next > field.latMax || next < field.latMin) { latDir *= -1; next = latitude + latDir * LAT_STEP; }
      latitude = next;
    }
    battery = battery > 15 ? battery - 0.02 : 100;
    const module = MODULES[moduleIndex];
    const moisture = soilMoisture(latitude, longitude);
    return {
      robot_id: "agbot_prototipo_v1",
      timestamp: Math.floor(timestampMs / 1000),
      location: { latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)), altitude_m: 750.2 },
      status: { battery_percent: Number(battery.toFixed(2)), active_module: module.id, speed_kmh: rand(1.2, 2.5, 2), e_stop: false },
      module_telemetry: builders[module.id](counters, { moisture, distance: LNG_STEP * METERS_PER_LNG_DEG }),
      environmental: { soil_moisture_percent: moisture, ambient_temp_c: rand(20.5, 22.5) },
    };
  }

  // Histórico inicial: os últimos `prefill` segundos de operação, percorrendo os módulos.
  const now = Date.now();
  const history = [];
  for (let i = prefill; i > 0; i -= 1) {
    selectModule(Math.floor(((prefill - i) / prefill) * 4) % MODULES.length);
    history.push(step(now - i * intervalMs));
  }
  selectModule(3);
  onPrefill?.(history);

  function tick() {
    if (Date.now() - lastSwitch >= rotationMs) {
      selectModule((moduleIndex + 1) % MODULES.length);
      lastSwitch = Date.now();
    }
    onData(step(Date.now()));
  }
  tick();
  const timer = window.setInterval(tick, intervalMs);

  return {
    stop: () => window.clearInterval(timer),
    setModule: (id) => {
      const index = MODULES.findIndex((module) => module.id === id);
      if (index < 0) return;
      selectModule(index);
      lastSwitch = Date.now();
      onData(step(Date.now()));
    },
  };
}
