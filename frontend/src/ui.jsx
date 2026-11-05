import { useMemo } from "react";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import { taskStatus } from "./Agenda.jsx";
import HistoryChart from "./HistoryChart.jsx";
import { sampleTimeline } from "./simulate.js";

export const clockFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const numberFormats = {};
export function fmt(value, digits = 1) {
  if (value == null || value === "") return null;
  if (typeof value !== "number") return String(value);
  numberFormats[digits] ??= new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits });
  return numberFormats[digits].format(value);
}
export function duration(ms) {
  const minutes = Math.round(ms / 60_000);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min` : `${minutes} min`;
}

// ---------- Peças de layout ----------
export function Panel({ icon, title, tag, wide, children }) {
  return (
    <section className={`ap-panel ${wide ? "wide" : ""}`}>
      <h3><span className="ap-panel-icon">{icon}</span>{title}{tag && <em>{tag}</em>}</h3>
      {children}
    </section>
  );
}

export function Rows({ items }) {
  return (
    <dl className="ap-rows">
      {items.filter(Boolean).map(([label, value, unit]) => (
        <div key={label}><dt>{label}</dt><dd>{value ?? "--"}{value != null && unit ? <small>{unit}</small> : null}</dd></div>
      ))}
    </dl>
  );
}

export function Big({ label, value, unit, sub, tone = "" }) {
  return (
    <div className={`ap-big ${tone}`}>
      <span>{label}</span>
      <strong>{value ?? "--"}{value != null && unit ? <small>{unit}</small> : null}</strong>
      {sub && <em>{sub}</em>}
    </div>
  );
}

export function Meter({ label, percent, detail, warnBelow = 25 }) {
  const value = Math.max(0, Math.min(100, percent ?? 0));
  return (
    <div className="ap-meter">
      <div><span>{label}</span><b>{detail ?? `${fmt(value, 0)}%`}</b></div>
      <div className="ap-meter-track"><i className={value < warnBelow ? "low" : ""} style={{ width: `${value}%` }} /></div>
    </div>
  );
}

export function Alerts({ items }) {
  const sorted = [...items].sort((a, b) => (a.level === "warn" ? -1 : 0) - (b.level === "warn" ? -1 : 0));
  if (!sorted.length) {
    return <p className="ap-ok"><CircleCheck size={15} /> Nenhum aviso ativo. Tudo operando normalmente.</p>;
  }
  return (
    <ul className="ap-alerts">
      {sorted.map((alert) => (
        <li key={alert.text} className={alert.level}>
          {alert.level === "warn" ? <TriangleAlert size={15} /> : <Info size={15} />}
          <span>{alert.text}</span>
          {alert.at && <time>{clockFormat.format(alert.at)}</time>}
        </li>
      ))}
    </ul>
  );
}

export function Pill({ tone = "ok", children }) {
  return <span className={`ap-pill ${tone}`}><i />{children}</span>;
}

export function DayChart({ title, points, color, tStart, tEnd, unit = "%", limits = [0, 100] }) {
  return (
    <div className="ap-chart">
      <HistoryChart title={title} unit={unit} points={points} color={color} domain={limits} limits={limits} tStart={tStart} tEnd={tEnd} digits={0} />
    </div>
  );
}

// Série do dia, uma leitura por minuto (o gráfico interrompe a linha acima disso).
export function useDaySeries(day, now, pick) {
  const minute = Math.floor(now / 60_000);
  return useMemo(() => {
    const points = [];
    const end = Math.min(minute * 60_000, day.end);
    for (let t = day.start; t <= end; t += 60_000) points.push({ t, v: pick(t) });
    return points;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, minute]);
}

export function tasksSummary(tasks, now) {
  const done = tasks.filter((task) => taskStatus(task, now) === "done");
  const running = tasks.filter((task) => taskStatus(task, now) === "now");
  const worked = [...done, ...running].reduce((sum, task) => sum + Math.min(now, task.end) - task.start, 0);
  const distance = [...done, ...running].reduce((sum, task) => {
    const sample = sampleTimeline(task.timeline, (Math.min(now, task.end) - task.start) / 1000);
    return sum + sample.distance;
  }, 0);
  return { total: tasks.length, done: done.length, running: running.length, worked, distance };
}

