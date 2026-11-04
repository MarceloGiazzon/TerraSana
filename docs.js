// Leitor de documentos: renderiza os arquivos Markdown do repositório como páginas do site.
const DOCS = {
  master: { group: "visao", title: "Plano diretor", path: "Visao/documento_master_agbot.md" },
  executiva: { group: "visao", title: "Apresentação executiva", path: "Visao/apresenta_o_executiva_agbot.md" },
  tecnica: { group: "visao", title: "Arquitetura técnica", path: "Visao/agbot_opensource_technical_specifications.md" },
  modulos: { group: "visao", title: "Especificação dos módulos", path: "Visao/especifica_o_detalhada_dos_m_dulos_agbot.md" },
  finep: { group: "visao", title: "Projeto executivo FINEP", path: "Visao/projeto_executivo_finep_tecnova.md" },
  m01: { group: "modulos", title: "01 · Roçador e cortador", path: "Robos/Modulos/01_Rocador_Cortador/README.md" },
  m02: { group: "modulos", title: "02 · Semeadora e adubadeira", path: "Robos/Modulos/02_Semeadora_Adubadeira/README.md" },
  m03: { group: "modulos", title: "03 · Análise de solo profundo", path: "Robos/Modulos/03_Sensor_Solo_Profundo/README.md" },
  m04: { group: "modulos", title: "04 · Moinho rotativo", path: "Robos/Modulos/04_Moinho Rotativo/README.md" },
  m05: { group: "modulos", title: "05 · Irrigador e pulverizador", path: "Robos/Modulos/05_Irrigador_Pulverizador/README.md" },
  m06: { group: "modulos", title: "06 · Braço de colheita", path: "Robos/Modulos/06_Braco_Colheita/README.md" },
  m07: { group: "modulos", title: "07 · Climatização e cogumelos", path: "Robos/Modulos/07_Cogumelo_Climatizacao/README.md" },
};

const params = new URLSearchParams(window.location.search);
const currentKey = DOCS[params.get("doc")] ? params.get("doc") : "master";
const current = DOCS[currentKey];
const body = document.getElementById("doc-body");

Object.entries(DOCS).forEach(([key, doc]) => {
  const link = document.createElement("a");
  link.href = `documento.html?doc=${key}`;
  link.textContent = doc.title;
  if (key === currentKey) link.setAttribute("aria-current", "page");
  document.querySelector(`.doc-nav[data-group="${doc.group}"]`).append(link);
});

document.getElementById("doc-kicker").textContent = current.group === "visao" ? "Visão e estratégia" : "Ficha técnica do módulo";
document.getElementById("doc-raw").href = encodeURI(current.path);
document.title = `Terra Sana | ${current.title}`;

function slugify(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function render() {
  try {
    const response = await fetch(encodeURI(current.path));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    // Protege as fórmulas antes do parser Markdown para que "_" e "\" não sejam reinterpretados.
    const formulas = [];
    const protectedText = markdown.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, (match) => {
      formulas.push(match);
      return `@@MATH${formulas.length - 1}@@`;
    });
    let html = window.marked.parse(protectedText, { gfm: true });
    html = html.replace(/@@MATH(\d+)@@/g, (_, index) => formulas[Number(index)].replace(/</g, "&lt;"));
    body.innerHTML = html;

    body.querySelectorAll("table").forEach((table) => {
      const wrap = document.createElement("div");
      wrap.className = "doc-table-wrap";
      table.replaceWith(wrap);
      wrap.append(table);
    });
    body.querySelectorAll("h2, h3").forEach((heading) => { heading.id = slugify(heading.textContent); });

    if (window.renderMathInElement) {
      window.renderMathInElement(body, {
        delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }],
        throwOnError: false,
      });
    }
  } catch (error) {
    body.innerHTML = `<p class="doc-loading">Não foi possível carregar este documento (${error.message}). <a href="${encodeURI(current.path)}">Abrir o arquivo original</a>.</p>`;
  }
}

render();
