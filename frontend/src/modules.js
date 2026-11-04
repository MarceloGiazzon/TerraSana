import { Apple, CloudFog, Cog, Droplet, FlaskConical, Gauge, Hand, Leaf, Package, Ruler, Scissors, Sprout, Target, Thermometer, Timer, Waves, Wind, Zap } from "lucide-react";

// Cada módulo declara as métricas que publica em `module_telemetry`.
// O mesmo identificador é usado pelo simulador Python e pelo firmware.
export const MODULES = [
  {
    id: "M01_ROCADOR",
    code: "M01",
    name: "Roçador",
    fullName: "Roçador e cortador",
    icon: Scissors,
    metrics: [
      { key: "blade_rpm", label: "Rotação da lâmina", unit: " rpm", icon: Cog },
      { key: "blade_current_amp", label: "Corrente da lâmina", unit: " A", icon: Zap },
      { key: "cut_height_mm", label: "Altura de corte", unit: " mm", icon: Ruler },
      { key: "area_cut_m2", label: "Área roçada", unit: " m²", icon: Leaf },
    ],
  },
  {
    id: "M02_SEMEADORA",
    code: "M02",
    name: "Semeadora",
    fullName: "Semeadora e adubadeira",
    icon: Sprout,
    metrics: [
      { key: "seeds_planted", label: "Sementes plantadas", unit: "", icon: Sprout },
      { key: "seed_spacing_cm", label: "Espaçamento", unit: " cm", icon: Ruler },
      { key: "hopper_level_percent", label: "Nível do reservatório", unit: "%", icon: Package },
      { key: "fertilizer_g_m", label: "Adubo aplicado", unit: " g/m", icon: Leaf },
    ],
  },
  {
    id: "M03_SOLO_PROFUNDO",
    code: "M03",
    name: "Análise de solo",
    fullName: "Análise de solo profundo",
    icon: FlaskConical,
    metrics: [
      { key: "samples_collected", label: "Amostras coletadas", unit: "", icon: FlaskConical },
      { key: "nitrogen_mg_kg", label: "Nitrogênio (N)", unit: " mg/kg", icon: FlaskConical },
      { key: "phosphorus_mg_kg", label: "Fósforo (P)", unit: " mg/kg", icon: FlaskConical },
      { key: "potassium_mg_kg", label: "Potássio (K)", unit: " mg/kg", icon: FlaskConical },
      { key: "ph", label: "pH do solo", unit: "", icon: Droplet },
      { key: "probe_depth_cm", label: "Profundidade da sonda", unit: " cm", icon: Ruler },
    ],
  },
  {
    id: "M04_MOINHO_ROTATIVO",
    code: "M04",
    name: "Moinho rotativo",
    fullName: "Moinho rotativo e cultivador",
    icon: Cog,
    legacyKey: "telemetry_m04",
    metrics: [
      { key: "motor_current_amp", label: "Corrente do motor", unit: " A", icon: Zap },
      { key: "soil_resistance_index", label: "Resistência do solo", unit: " idx", icon: Wind },
      { key: "depth_cm", label: "Profundidade de trabalho", unit: " cm", icon: Ruler },
    ],
  },
  {
    id: "M05_IRRIGADOR",
    code: "M05",
    name: "Irrigador",
    fullName: "Irrigador e pulverizador",
    icon: Droplet,
    metrics: [
      { key: "tank_level_percent", label: "Nível do tanque", unit: "%", icon: Package },
      { key: "flow_lpm", label: "Vazão", unit: " L/min", icon: Waves },
      { key: "pressure_bar", label: "Pressão", unit: " bar", icon: Gauge },
      { key: "applied_l", label: "Volume aplicado", unit: " L", icon: Droplet },
    ],
  },
  {
    id: "M06_COLHEITA",
    code: "M06",
    name: "Colheita",
    fullName: "Braço robótico de colheita",
    icon: Hand,
    metrics: [
      { key: "harvested_count", label: "Frutos colhidos", unit: "", icon: Apple },
      { key: "detection_confidence_percent", label: "Confiança da visão", unit: "%", icon: Target },
      { key: "grip_force_n", label: "Força da garra", unit: " N", icon: Hand },
      { key: "cycle_time_s", label: "Tempo por ciclo", unit: " s", icon: Timer },
    ],
  },
  {
    id: "M07_COGUMELOS",
    code: "M07",
    name: "Cogumelos",
    fullName: "Climatização e cogumelos",
    icon: CloudFog,
    metrics: [
      { key: "co2_ppm", label: "CO₂", unit: " ppm", icon: Wind },
      { key: "air_humidity_percent", label: "Umidade do ar", unit: "%", icon: Droplet },
      { key: "air_temp_c", label: "Temperatura do ar", unit: " °C", icon: Thermometer },
      { key: "fogger_on", label: "Nebulizador", unit: "", icon: CloudFog, format: (value) => (value ? "Ligado" : "Desligado") },
    ],
  },
];

export function findModule(activeModule) {
  if (typeof activeModule !== "string") return null;
  const code = activeModule.slice(0, 3).toUpperCase();
  return MODULES.find((module) => module.id === activeModule || module.code === code) ?? null;
}

// Aceita o formato novo (`module_telemetry`) e o antigo do M04 (`telemetry_m04`).
export function moduleTelemetry(telemetry, module) {
  if (telemetry?.module_telemetry && typeof telemetry.module_telemetry === "object") return telemetry.module_telemetry;
  if (module?.legacyKey && telemetry?.[module.legacyKey]) return telemetry[module.legacyKey];
  return {};
}
