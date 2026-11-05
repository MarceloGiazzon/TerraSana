// Gera uma coleção de capturas de tela do painel em vários tamanhos de tela.
//
//   npm run dev                       (em outro terminal)
//   npm run shots                     (todas as telas e páginas)
//   npm run shots -- --device=mobile  (só dispositivos cujo nome contém "mobile")
//   npm run shots -- --page=hub --url=http://localhost:4173
//
// Usa o Chrome instalado no sistema (playwright-core não baixa navegador).
import { mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=")));
const MAX_STRIP_PX = 4000;
const BASE = args.url ?? "http://localhost:5173";
const OUT = fileURLToPath(new URL("../screenshots/", import.meta.url));

const DEVICES = [
  { id: "tv-4k", view: 760, label: "TV 4K", group: "Monitor grande / TV", width: 3840, height: 2160 },
  { id: "monitor-qhd", view: 720, label: "Monitor QHD", group: "Monitor grande / TV", width: 2560, height: 1440 },
  { id: "monitor-fhd", view: 680, label: "Monitor Full HD", group: "Monitor / notebook", width: 1920, height: 1080 },
  { id: "notebook", view: 620, label: "Notebook 1440×900", group: "Monitor / notebook", width: 1440, height: 900 },
  { id: "notebook-hd", view: 600, label: "Notebook HD 1366×768", group: "Monitor / notebook", width: 1366, height: 768 },
  { id: "tablet-paisagem", view: 620, label: "Tablet horizontal", group: "Tablet", width: 1180, height: 820, touch: true, scale: 2 },
  { id: "tablet-retrato", view: 400, label: "Tablet vertical", group: "Tablet", width: 820, height: 1180, touch: true, scale: 2 },
  { id: "mobile-retrato", view: 260, label: "Celular vertical", group: "Celular", width: 390, height: 844, touch: true, scale: 2 },
  { id: "mobile-paisagem", view: 600, label: "Celular horizontal", group: "Celular", width: 844, height: 390, touch: true, scale: 2 },
];
const PAGES = [
  { id: "painel", label: "Painel", hash: "#/" },
  { id: "dashboard", label: "Dashboard", hash: "#/dashboard" },
  { id: "hub", label: "AgHub", hash: "#/agente/hub" },
  { id: "drone", label: "Infodrone", hash: "#/agente/drone" },
  { id: "agbot", label: "AgBot", hash: "#/agente/agbot" },
];

const devices = DEVICES.filter((d) => !args.device || d.id.includes(args.device));
const pages = PAGES.filter((p) => !args.page || p.id === args.page);

await rm(OUT, { recursive: true, force: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const results = [];

for (const device of devices) {
  await mkdir(`${OUT}${device.id}`, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.scale ?? 1,
    hasTouch: Boolean(device.touch),
    isMobile: Boolean(device.touch && device.width < 700),
  });
  const page = await context.newPage();
  for (const target of pages) {
    await page.goto(`${BASE}/?fonte=demo${target.hash}`, { waitUntil: "load" });
    await page.waitForSelector(target.id === "painel" ? ".dashboard" : ".agent-page, .dashboard-page", { timeout: 20000 });
    if (target.id === "painel") await page.waitForSelector(".maplibregl-canvas, .leaflet-container", { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(target.id === "painel" ? 3500 : 2000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    // Páginas muito altas saem duplicadas no Chrome: captura em faixas de até 4000 px de imagem.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const strip = Math.floor(MAX_STRIP_PX / (device.scale ?? 1));
    const files = [];
    if (height <= strip) {
      files.push(`${device.id}/${target.id}.png`);
      await page.screenshot({ path: `${OUT}${files[0]}`, fullPage: true });
    } else {
      for (let y = 0, i = 1; y < height; y += strip, i += 1) {
        const file = `${device.id}/${target.id}-${i}.png`;
        await page.screenshot({ path: `${OUT}${file}`, fullPage: true, clip: { x: 0, y, width: device.width, height: Math.min(strip, height - y) } });
        files.push(file);
      }
    }
    results.push({ device, target, files, overflow });
    console.log(`${files.join(", ")}${overflow > 1 ? `  ⚠ rolagem horizontal de ${overflow}px` : ""}`);
  }
  await context.close();
}
await browser.close();

const groups = [...new Set(results.map((r) => r.device.group))];
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Capturas do painel</title>
<style>
body{margin:0;padding:24px;background:#f4f5f0;color:#202820;font:14px system-ui,sans-serif}
h1{margin:0 0 4px}h2{margin:32px 0 8px;font-size:18px}h3{margin:16px 0 6px;font-size:14px}
p{margin:0;color:#667}.row{display:flex;gap:16px;overflow-x:auto;padding-bottom:12px;align-items:flex-start}
figure{margin:0;flex:0 0 auto}figcaption{margin-bottom:4px;font-size:12px;color:#556}
img{display:block;width:100%;border:1px solid #d9ddd2;border-radius:4px;background:#fff}
.strips{display:flex;flex-direction:column}.strips img{border-radius:0;border-top:0}.strips a:first-child img{border-top:1px solid #d9ddd2;border-radius:4px 4px 0 0}.warn{color:#b4532d;font-weight:600}
</style><h1>Capturas do painel</h1><p>Gerado em ${new Date().toLocaleString("pt-BR")} · ${BASE}</p>
${groups.map((group) => `<h2>${group}</h2>${[...new Set(results.filter((r) => r.device.group === group).map((r) => r.device.id))].map((id) => {
  const rows = results.filter((r) => r.device.id === id);
  const d = rows[0].device;
  return `<h3>${d.label} · ${d.width}×${d.height}</h3><div class="row">${rows.map((r) => `<figure style="width:${d.view}px"><figcaption>${r.target.label}${r.overflow > 1 ? ` <span class="warn">⚠ rolagem horizontal ${r.overflow}px</span>` : ""}</figcaption><div class="strips">${r.files.map((file) => `<a href="${file}" target="_blank"><img loading="lazy" src="${file}" alt="${d.label} · ${r.target.label}"></a>`).join("")}</div></figure>`).join("")}</div>`;
}).join("")}`).join("")}`;
await writeFile(`${OUT}index.html`, html);
console.log(`\nGaleria: ${OUT}index.html`);
