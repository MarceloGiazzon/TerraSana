import { Pause, Play, Radio, RotateCcw } from "lucide-react";

const SPEEDS = [1, 2, 4, 8, 16, 32];
const clock = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function duration(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}h${String(m).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

/** Controles da retrospectiva: reproduzir, avançar na barra de tempo e escolher a velocidade. */
export default function ReplayBar({ task, cursor, playing, speed, onSeek, onTogglePlay, onSpeed, onExit }) {
  const finished = cursor >= task.end;
  return (
    <div className="replay-bar" role="region" aria-label="Controles da retrospectiva">
      <button
        type="button"
        className="replay-play"
        onClick={() => (finished ? onSeek(task.start, true) : onTogglePlay())}
        aria-label={finished ? "Reproduzir de novo" : playing ? "Pausar" : "Reproduzir"}
      >
        {finished ? <RotateCcw size={16} /> : playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <div className="replay-timeline">
        <div className="replay-times">
          <span>Início <b>{clock.format(task.start)}</b></span>
          <strong>{clock.format(cursor)} <small>{duration(cursor - task.start)} de {duration(task.end - task.start)}</small></strong>
          <span>Fim <b>{clock.format(task.end)}</b></span>
        </div>
        <input
          type="range"
          min={task.start}
          max={task.end}
          step={1000}
          value={cursor}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="Posição na retrospectiva"
          aria-valuetext={clock.format(cursor)}
          style={{ "--progress": `${((cursor - task.start) / (task.end - task.start)) * 100}%` }}
        />
      </div>
      <div className="replay-speeds" role="group" aria-label="Velocidade de reprodução">
        {SPEEDS.map((value) => (
          <button key={value} type="button" className={speed === value ? "selected" : ""} aria-pressed={speed === value} onClick={() => onSpeed(value)}>{value}x</button>
        ))}
      </div>
      <button type="button" className="replay-exit" onClick={onExit}><Radio size={14} /> Voltar ao vivo</button>
    </div>
  );
}
