import { Bot, CalendarClock, Check, ChevronRight, Lock, Play, Radio } from "lucide-react";
import { findModule } from "./modules.js";
import DroneIcon from "./DroneIcon.jsx";

const clock = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const PAD_MS = 10 * 60_000;

export function taskStatus(task, now) {
  if (now > task.end) return "done";
  if (now >= task.start) return "now";
  return "next";
}

function TaskIcon({ task, size = 14 }) {
  if (task.agent === "drone") return <DroneIcon size={size} />;
  const Icon = findModule(task.module)?.icon ?? Bot;
  return <Icon size={size} strokeWidth={1.8} />;
}

function taskLabel(task) {
  const module = findModule(task.module);
  return `${module ? `${module.code} · ` : "Infodrone · "}${task.title}`;
}

/**
 * Agenda do dia: linha do tempo por agente e lista de tarefas.
 * Tarefas concluídas abrem a retrospectiva; a tarefa em andamento volta ao vivo.
 */
export default function Agenda({ day, now, cursor, selectedId, onReplay, onLive }) {
  const t0 = day.start - PAD_MS;
  const t1 = day.end + PAD_MS;
  const pct = (t) => `${((t - t0) / (t1 - t0)) * 100}%`;
  const hours = [];
  for (let h = Math.ceil(t0 / 3_600_000) * 3_600_000; h <= t1; h += 3_600_000) hours.push(h);
  const lanes = [
    { id: "agbot", label: "AgBot", icon: <Bot size={14} strokeWidth={1.8} />, tasks: day.agbot },
    { id: "drone", label: "Infodrone", icon: <DroneIcon size={14} />, tasks: day.drone },
  ];

  function activate(task) {
    const status = taskStatus(task, now);
    if (status === "done") onReplay(task);
    else if (status === "now") onLive();
  }

  const groups = [
    { id: "now", title: "Agora", tasks: day.all.filter((task) => taskStatus(task, now) === "now") },
    { id: "next", title: "A seguir", tasks: day.all.filter((task) => taskStatus(task, now) === "next") },
    { id: "done", title: "Concluídas", tasks: day.all.filter((task) => taskStatus(task, now) === "done").reverse() },
  ];

  return (
    <section className="agenda" aria-labelledby="agenda-heading">
      <div className="history-section-head">
        <h2 id="agenda-heading"><CalendarClock size={17} /> Agenda do dia</h2>
        <span>Clique numa tarefa concluída para ver a retrospectiva</span>
        <span className="agenda-key"><i className="done" /> Concluída <i className="now" /> Em andamento <i className="next" /> Agendada</span>
      </div>

      <div className="gantt-scroll">
        <div className="gantt">
          <div className="gantt-axis" aria-hidden="true">
            {hours.map((h) => <span key={h} style={{ left: pct(h) }}>{clock.format(h)}</span>)}
          </div>
          {lanes.map((lane) => (
            <div className="gantt-lane" key={lane.id}>
              <span className="gantt-lane-label">{lane.icon}{lane.label}</span>
              <div className="gantt-track">
                {hours.map((h) => <i key={h} className="gantt-hour" style={{ left: pct(h) }} />)}
                {lane.tasks.map((task) => {
                  const status = taskStatus(task, now);
                  const progress = status === "now" ? (now - task.start) / (task.end - task.start) : 0;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      className={`gantt-task ${status} ${selectedId === task.id ? "selected" : ""}`}
                      style={{ left: pct(task.start), width: `max(8px, ${((task.end - task.start) / (t1 - t0)) * 100}%)` }}
                      disabled={status === "next"}
                      title={`${taskLabel(task)} · ${clock.format(task.start)}–${clock.format(task.end)}`}
                      aria-label={`${taskLabel(task)}, ${task.zone}, das ${clock.format(task.start)} às ${clock.format(task.end)}${status === "done" ? ", concluída: abrir retrospectiva" : status === "now" ? ", em andamento" : ", agendada"}`}
                      onClick={() => activate(task)}
                    >
                      {status === "now" && <span className="gantt-progress" style={{ width: `${progress * 100}%` }} />}
                      <TaskIcon task={task} size={12} />
                      <span className="gantt-task-text">{task.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="gantt-now" style={{ left: `calc(84px + (100% - 84px) * ${(now - t0) / (t1 - t0)})` }} aria-hidden="true"><span>agora</span></div>
          {cursor != null && cursor !== now && (
            <div className="gantt-cursor" style={{ left: `calc(84px + (100% - 84px) * ${(cursor - t0) / (t1 - t0)})` }} aria-hidden="true" />
          )}
        </div>
      </div>

      <div className="agenda-lists">
        {groups.map((group) => (
          <div className="agenda-group" key={group.id}>
            <h3>{group.title} <span>{group.tasks.length}</span></h3>
            {!group.tasks.length && <p className="agenda-empty">Nenhuma tarefa</p>}
            <ul>
              {group.tasks.map((task) => {
                const status = group.id;
                const selected = selectedId === task.id;
                return (
                  <li key={task.id}>
                    <button type="button" className={`agenda-item ${status} ${selected ? "selected" : ""}`} disabled={status === "next"} onClick={() => activate(task)}>
                      <span className="agenda-icon"><TaskIcon task={task} /></span>
                      <span className="agenda-copy">
                        <strong>{task.title}</strong>
                        <small>{task.agent === "drone" ? "Infodrone" : findModule(task.module)?.code} · {task.zone}</small>
                      </span>
                      <span className="agenda-time">
                        {clock.format(task.start)}–{clock.format(task.end)}
                        {status === "done" && <em>{selected ? <><Play size={11} /> em revisão</> : <><Check size={11} /> ver <ChevronRight size={11} /></>}</em>}
                        {status === "now" && <em className="live"><Radio size={11} /> ao vivo</em>}
                        {status === "next" && <em className="locked"><Lock size={11} /> agendada</em>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
