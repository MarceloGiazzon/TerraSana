import { useEffect, useMemo, useRef, useState } from "react";

const HEIGHT = 150;
const PAD = { top: 12, right: 12, bottom: 22, left: 34 };
const GAP_MS = 60_000; // acima disso a linha é interrompida (sem dados no intervalo)

const numberFormat = (digits) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const timeFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const fullTimeFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function niceDomain(values, fallback) {
  if (!values.length) return fallback ?? [0, 100];
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (fallback) {
    min = Math.min(min, fallback[0]);
    max = Math.max(max, fallback[1]);
  }
  if (max - min < 1) { min -= 0.5; max += 0.5; }
  const step = (max - min) / 4;
  return [Math.floor(min - step * 0.2), Math.ceil(max + step * 0.2)];
}

/**
 * Gráfico de linha de uma série, com linha de referência e tooltip.
 * points: [{ t: ms, v: number }]
 */
export default function HistoryChart({ title, unit, points, color, domain, digits = 1 }) {
  const format = useMemo(() => numberFormat(digits), [digits]);
  const show = (value) => format.format(value);
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(480);
  const [hover, setHover] = useState(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [showTable]);

  const data = useMemo(() => points.filter((point) => Number.isFinite(point.v) && Number.isFinite(point.t)), [points]);
  const [yMin, yMax] = useMemo(() => niceDomain(data.map((point) => point.v), domain), [data, domain]);
  const tMin = data.length ? data[0].t : Date.now() - 60_000;
  const tMax = data.length > 1 ? data[data.length - 1].t : tMin + 60_000;
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (t) => PAD.left + ((t - tMin) / (tMax - tMin || 1)) * innerW;
  const y = (v) => PAD.top + (1 - (v - yMin) / (yMax - yMin || 1)) * innerH;

  const path = useMemo(() => {
    let d = "";
    data.forEach((point, index) => {
      const gap = index === 0 || point.t - data[index - 1].t > GAP_MS;
      d += `${gap ? "M" : "L"}${x(point.t).toFixed(1)},${y(point.v).toFixed(1)}`;
    });
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width, yMin, yMax]);

  const ticks = [yMin, (yMin + yMax) / 2, yMax];
  const current = data[data.length - 1];
  const active = hover != null ? data[hover] : null;

  function nearestIndex(clientX) {
    const rect = wrapRef.current.getBoundingClientRect();
    const t = tMin + ((clientX - rect.left - PAD.left) / innerW) * (tMax - tMin);
    let lo = 0;
    let hi = data.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (data[mid].t < t) lo = mid + 1; else hi = mid;
    }
    if (lo > 0 && Math.abs(data[lo - 1].t - t) < Math.abs(data[lo].t - t)) lo -= 1;
    return lo;
  }

  function onKeyDown(event) {
    if (!data.length) return;
    const step = event.shiftKey ? 10 : 1;
    if (event.key === "ArrowLeft") setHover((index) => Math.max(0, (index ?? data.length - 1) - step));
    else if (event.key === "ArrowRight") setHover((index) => Math.min(data.length - 1, (index ?? data.length - 1) + step));
    else if (event.key === "Escape") setHover(null);
    else return;
    event.preventDefault();
  }

  const summary = data.length
    ? `${title}: atual ${show(current.v)}${unit}, mínimo ${show(Math.min(...data.map((p) => p.v)))}${unit}, máximo ${show(Math.max(...data.map((p) => p.v)))}${unit}, ${data.length} leituras.`
    : `${title}: sem leituras ainda.`;

  return (
    <div className="history-card">
      <div className="history-head">
        <div>
          <span className="history-title">{title}</span>
          <strong>{current ? show(current.v) : "--"}<small>{current ? unit : ""}</small></strong>
        </div>
        <button type="button" className="history-table-toggle" aria-pressed={showTable} onClick={() => setShowTable((value) => !value)}>
          {showTable ? "Gráfico" : "Tabela"}
        </button>
      </div>

      {showTable ? (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead><tr><th scope="col">Horário</th><th scope="col">{title}</th></tr></thead>
            <tbody>
              {data.slice(-12).reverse().map((point) => (
                <tr key={point.t}><td>{fullTimeFormat.format(point.t)}</td><td>{show(point.v)}{unit}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          ref={wrapRef}
          className="history-plot"
          tabIndex={0}
          role="img"
          aria-label={summary}
          onPointerMove={(event) => data.length && setHover(nearestIndex(event.clientX))}
          onPointerLeave={() => setHover(null)}
          onBlur={() => setHover(null)}
          onKeyDown={onKeyDown}
        >
          <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} aria-hidden="true">
            {ticks.map((tick) => (
              <g key={tick}>
                <line className="history-gridline" x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} />
                <text className="history-axis" x={PAD.left - 6} y={y(tick) + 3} textAnchor="end">{Math.round(tick)}</text>
              </g>
            ))}
            {data.length > 1 && (
              <>
                <text className="history-axis" x={PAD.left} y={HEIGHT - 6}>{timeFormat.format(tMin)}</text>
                <text className="history-axis" x={width - PAD.right} y={HEIGHT - 6} textAnchor="end">{timeFormat.format(tMax)}</text>
              </>
            )}
            <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {current && !active && <circle cx={x(current.t)} cy={y(current.v)} r="4" fill={color} stroke="#fffefa" strokeWidth="2" />}
            {active && (
              <>
                <line className="history-crosshair" x1={x(active.t)} x2={x(active.t)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
                <circle cx={x(active.t)} cy={y(active.v)} r="4.5" fill={color} stroke="#fffefa" strokeWidth="2" />
              </>
            )}
          </svg>
          {active && (
            <div className="history-tooltip" style={{ left: Math.min(width - 120, Math.max(0, x(active.t) - 55)) }}>
              <strong>{show(active.v)}{unit}</strong>
              <span><i style={{ background: color }} />{fullTimeFormat.format(active.t)}</span>
            </div>
          )}
          {!data.length && <p className="history-empty">Aguardando leituras…</p>}
        </div>
      )}
    </div>
  );
}
