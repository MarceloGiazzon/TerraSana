// Geometria da propriedade, baseada na medição original (data/area-medicao.png):
// faixa de ~372 m × ~57 m, levemente inclinada, com o portão no canto sudeste,
// junto à estrada, e o açude no extremo oeste.
//
// Tudo é desenhado num sistema local em metros: u ao longo da faixa
// (negativo = oeste) e v na largura (positivo = norte), com origem no portão.

const DEG = Math.PI / 180;
export const ORIGIN = { lat: -29.1162948, lng: -51.2242858 };
const ROTATION = 3.9 * DEG; // inclinação da faixa em relação ao leste
const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LNG = 111320 * Math.cos(ORIGIN.lat * DEG);
const COS = Math.cos(ROTATION);
const SIN = Math.sin(ROTATION);

/** Converte coordenadas locais (m) em [lng, lat]. */
export function toLngLat(u, v) {
  const x = u * COS - v * SIN;
  const y = u * SIN + v * COS;
  return [ORIGIN.lng + x / M_PER_DEG_LNG, ORIGIN.lat + y / M_PER_DEG_LAT];
}

const ring = (points) => {
  const coords = points.map(([u, v]) => toLngLat(u, v));
  return [...coords, coords[0]];
};
const rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];

// Contorno "orgânico" e determinístico para açude e mata.
function blob(cu, cv, ru, rv, seed, n = 22) {
  const points = [];
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const wobble = 1 + 0.09 * Math.sin(a * 3 + seed) + 0.06 * Math.sin(a * 5 + seed * 2.3) + 0.04 * Math.cos(a * 7 + seed);
    points.push([cu + Math.cos(a) * ru * wobble, cv + Math.sin(a) * rv * wobble]);
  }
  return points;
}

function shoelace(points) {
  let sum = 0;
  points.forEach(([u, v], i) => {
    const [u2, v2] = points[(i + 1) % points.length];
    sum += u * v2 - u2 * v;
  });
  return Math.abs(sum) / 2;
}

// Cerca: cantos da medição, com pequenas inflexões ao longo das divisas.
const BOUNDARY = [
  [0, 0], [-60, 0.6], [-140, -0.4], [-230, 0.9], [-300, -0.8], [-371.9, -1.3],
  [-375.2, 30], [-375.9, 58.7],
  [-330, 59.3], [-260, 57.2], [-170, 57.9], [-80, 56.8], [-14.5, 55.9],
  [-5.6, 28],
];

export const ZONES = {
  gramado: rect(-76, -34, 8, 54),
  horta: rect(-300, -82, 8, 55),
  pomar: rect(-336, -306, 8, 55),
  acude: blob(-356, 13, 13.5, 8.5, 1.7),
  mata: blob(-357, 42, 15, 12.8, 4.2),
};

// Talhões da horta, de leste para oeste.
const PLOT_GAP = 2;
const PLOT_W = (218 - PLOT_GAP * 5) / 6;
export const PLOTS = ["Alface", "Couve", "Tomate", "Beterraba", "Cenoura", "Adubação verde"].map((crop, index) => {
  const u0 = -82 - index * (PLOT_W + PLOT_GAP);
  return { id: index + 1, crop, u0, u1: u0 - PLOT_W, v0: 8.6, v1: 54.4 };
});
export const BED_SPACING = 1.6;

export const PLACES = {
  gate: [-2, 2],
  dock: [-14.5, 13],          // doca de recarga do AgBot, em frente ao galpão
  nest: [-10.5, 19.5],        // ninho do Infodrone
  roadV: 4.5,                 // eixo da estrada interna
  chamberDoor: [-21, 21],
  chamber: { u0: -30, u1: -22, v: 21 },
  shiitake: [[-362, 38], [-354, 45], [-350, 37], [-361, 47]],
};

export const TREES = [];
for (let i = 0; i < 5; i += 1) for (let j = 0; j < 8; j += 1) TREES.push([-309 - 6 * i, 11.5 + 6 * j]);

const BUILDINGS = [
  { name: "Galpão · AgHub", points: rect(-30, -16.5, 9, 17.5) },
  { name: "Câmara de cogumelos", points: rect(-30, -22, 20, 22) },
  { name: "Doca", points: rect(-16.5, -12.5, 11, 15), kind: "pad" },
  { name: "Ninho do drone", points: rect(-12, -9, 18, 21), kind: "pad" },
];

function feature(kind, geometry, properties = {}) {
  return { type: "Feature", properties: { kind, ...properties }, geometry };
}
const polygon = (points) => ({ type: "Polygon", coordinates: [ring(points)] });

export const boundaryAreaM2 = shoelace(BOUNDARY);
export const boundaryGeoJson = {
  type: "FeatureCollection",
  features: [feature("boundary", polygon(BOUNDARY), { name: "Propriedade Terra Sana", area_m2: Math.round(boundaryAreaM2) })],
};

// Cores suaves por cultura, sem competir com as camadas de dados.
const CROP_COLORS = ["#cfe1b9", "#bcd6a6", "#d6e3b0", "#c9d9b2", "#dccfb8", "#c3d8a0"];

export const farmGeoJson = (() => {
  const features = [
    feature("lawn", polygon(ZONES.gramado), { name: "Gramado" }),
    feature("orchard", polygon(ZONES.pomar), { name: "Pomar" }),
    feature("forest", polygon(ZONES.mata), { name: "Mata úmida" }),
    feature("water", polygon(ZONES.acude), { name: "Açude" }),
    feature("road", { type: "LineString", coordinates: [PLACES.gate, [-12, PLACES.roadV], [-150, PLACES.roadV + 0.4], [-304, PLACES.roadV]].map(([u, v]) => toLngLat(u, v)) }),
    feature("road", { type: "LineString", coordinates: [[-14.5, PLACES.roadV], [-14.5, 11]].map(([u, v]) => toLngLat(u, v)) }),
  ];
  PLOTS.forEach((plot, index) => {
    features.push(feature("plot", polygon(rect(plot.u0, plot.u1, plot.v0, plot.v1)), { name: `Talhão ${plot.id} · ${plot.crop}`, color: CROP_COLORS[index] }));
    for (let v = plot.v0 + 0.8; v < plot.v1; v += BED_SPACING) {
      features.push(feature("bed", { type: "LineString", coordinates: [toLngLat(plot.u0 - 0.6, v), toLngLat(plot.u1 + 0.6, v)] }));
    }
  });
  TREES.forEach(([u, v]) => features.push(feature("tree", { type: "Point", coordinates: toLngLat(u, v) })));
  PLACES.shiitake.forEach(([u, v]) => features.push(feature("logs", { type: "Point", coordinates: toLngLat(u, v) })));
  BUILDINGS.forEach((building) => features.push(feature(building.kind ?? "building", polygon(building.points), { name: building.name })));
  return { type: "FeatureCollection", features };
})();

export const LABELS = [
  { text: "Sede · AgHub", at: [-23, 4.8], align: "below" },
  { text: "Gramado", at: [-55, 31] },
  { text: "Horta", at: [-191, 31] },
  { text: "Pomar", at: [-321, 31] },
  { text: "Mata úmida", at: [-357, 42] },
  { text: "Açude", at: [-356, 13] },
].map((label) => ({ ...label, lngLat: toLngLat(...label.at) }));

const lngs = boundaryGeoJson.features[0].geometry.coordinates[0].map((point) => point[0]);
const lats = boundaryGeoJson.features[0].geometry.coordinates[0].map((point) => point[1]);
export const bounds = { lngMin: Math.min(...lngs), lngMax: Math.max(...lngs), latMin: Math.min(...lats), latMax: Math.max(...lats) };
