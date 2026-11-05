import { useMemo } from "react";
import { Bell, ChevronRight, Droplets, Gauge, ListChecks, Plug, Radio, Route, Server, Thermometer, Timer } from "lucide-react";
import Agenda, { taskStatus } from "./Agenda.jsx";
import DroneIcon from "./DroneIcon.jsx";
import PageNav from "./PageNav.jsx";
import { Alerts, DayChart, Panel, Pill, clockFormat, duration, fmt, tasksSummary, useDaySeries } from "./ui.jsx";
import { hubDetails } from "./hub.js";
import { findModule } from "./modules.js";
import { agbotBattery, agbotState, droneState, taskSamples } from "./simulate.js";
import { Bot } from "lucide-react";

function Kpi({ icon, label, value, unit, sub, tone = "" }) {
  return (
    <div className={`dash-kpi ${tone}`}>
      <span className="dash-kpi-icon">{icon}</span>
      <span className="dash-kpi-label">{label}</span>
      <strong>{value ?? "--"}{value != null && unit ? <small>{unit}</small> : null}</strong>
      {sub && <em>{sub}</em>}
    </div>
  );
}

function AgentCard({ href, icon, name, status, tone, figures, task, now }) {
  const progress = task ? Math.min(1, Math.max(0, (now - task.start) / (task.end - task.start))) : null;
  return (
    <a className="dash-agent" href={href}>
      <div className="dash-agent-head">
        <span className="dash-agent-icon">{icon}</span>
        <div>
          <h3>{name}</h3>
          <Pill tone={tone}>{status}</Pill>
        </div>
        <ChevronRight size={18} className="dash-agent-chevron" />
      </div>
      <dl className="dash-figures">
        {figures.map(([label, value, unit]) => (
          <div key={label}><dt>{label}</dt><dd>{value ?? "--"}{value != null && unit ? <small>{unit}</small> : null}</dd></div>
        ))}
      </dl>
      <div className="dash-task">
        {task ? (
          <>
            <span><b>{task.title}</b> · {task.zone}</span>
            <div className="ap-meter-track"><i style={{ width: `${progress * 100}%` }} /></div>
            <small>{clockFormat.format(task.start)} → {clockFormat.format(task.end)} · {Math.round(progress * 100)}%</small>
          </>
        ) : <span className="ap-muted">Sem tarefa em andamento</span>}
      </div>
    </a>
  );
}

/** Dashboard da operação: visão geral de todos os agentes e do dia. */
export default function DashboardPage({ day, now, replayTaskId, onReplay, onLive }) {
  const agbot = useMemo(() => agbotState(day, now), [day, now]);
  const drone = useMemo(() => droneState(day, now), [day, now]);
  const hub = useMemo(() => hubDetails(day, now), [day, now]);
  const all = tasksSummary(day.all, now);
  const bot = tasksSummary(day.agbot, now);
  const flights = tasksSummary(day.drone, now);
  const planned = day.all.reduce((sum, task) => sum + task.durationMs, 0);
  const progress = Math.min(1, Math.max(0, (now - day.start) / (day.end - day.start)));

  const moisture = useMemo(() => {
    const values = day.agbot
      .filter((task) => task.start <= now)
      .flatMap((task) => taskSamples(day, task).filter((sample) => sample.work && sample.t <= now))
      .map((sample) => sample.moisture);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }, [day, now]);

  const batteryBot = useDaySeries(day, now, (t) => agbotBattery(day, t));
  const batteryDrone = useDaySeries(day, now, (t) => droneState(day, t).battery);
  const load = useDaySeries(day, now, (t) => hubDetails(day, t).power.loadKw);
  const moistureSeries = useDaySeries(day, now, (t) => agbotState(day, t).payload.environmental.soil_moisture_percent);

  const status = agbot.payload.status;
  const warnings = hub.alerts.filter((alert) => alert.level === "warn").length;
  const running = day.all.filter((task) => taskStatus(task, now) === "now");

  return (
    <section className="dashboard-page" aria-labelledby="dash-title">
      <PageNav current="dashboard" />
      <header className="ap-header">
        <span className="ap-avatar"><Gauge size={22} strokeWidth={1.8} /></span>
        <div>
          <p className="eyebrow">OPERAÇÃO <span> / </span> VISÃO GERAL DO DIA</p>
          <h1 id="dash-title">Dashboard</h1>
        </div>
        <Pill tone={running.length ? "live" : "idle"}>{running.length ? `${running.length} atividade${running.length > 1 ? "s" : ""} em andamento` : "Nenhuma atividade em andamento"}</Pill>
        <Pill tone={warnings ? "live" : "ok"}>{warnings ? `${warnings} aviso${warnings > 1 ? "s" : ""} de atenção` : "Sem avisos de atenção"}</Pill>
        <span className="ap-updated"><Radio size={13} /> {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now)}</span>
      </header>

      <div className="dash-kpis">
        <Kpi icon={<ListChecks size={16} />} label="Tarefas do dia" value={`${all.done}/${all.total}`} sub={all.running ? `${all.running} em andamento` : "concluídas"} />
        <Kpi icon={<Timer size={16} />} label="Plano do dia" value={fmt(progress * 100, 0)} unit="%" sub={`${duration(planned)} planejados`} />
        <Kpi icon={<Route size={16} />} label="Percorrido pelo AgBot" value={fmt(bot.distance / 1000, 2)} unit=" km" sub={`${bot.done}/${bot.total} tarefas`} />
        <Kpi icon={<Droplets size={16} />} label="Água usada" value={fmt(hub.water.usedTodayL, 1)} unit=" L" sub={`reservatório ${hub.water.percent}%`} />
        <Kpi icon={<Plug size={16} />} label="Energia hoje" value={fmt(hub.power.todayKwh, 1)} unit=" kWh" sub={`carga ${fmt(hub.power.loadKw, 2)} kW`} />
        <Kpi icon={<Droplets size={16} />} label="Umidade média medida" value={fmt(moisture, 1)} unit="%" sub="solo, hoje" />
        <Kpi icon={<Thermometer size={16} />} label="Temperatura do ar" value={fmt(hub.weather.temperatureC, 1)} unit=" °C" sub={`vento ${hub.weather.windKmh} km/h ${hub.weather.windDir}`} />
        <Kpi icon={<DroneIcon size={16} />} label="Voos do Infodrone" value={`${flights.done}/${flights.total}`} sub={duration(flights.worked) + " no ar"} />
      </div>

      <div className="dash-agents">
        <AgentCard
          href="#/agente/hub" icon={<Server size={20} strokeWidth={1.8} />} name="AgHub" tone="ok" status="Online · sempre ativo" now={now}
          figures={[["Energia", `${hub.power.voltage}`, " V"], ["Satélites", hub.rtk.satellites], ["Água", `${hub.water.percent}`, "%"], ["Insumos", `${hub.supplies.seedsPercent}`, "%"]]}
        />
        <AgentCard
          href="#/agente/drone" icon={<DroneIcon size={20} />} name="Infodrone" tone={drone.task ? "live" : "idle"} status={drone.phase} now={now} task={drone.task}
          figures={[["Bateria", fmt(drone.battery, 0), "%"], ["Altitude", fmt(drone.altitude, 0), " m"], ["Velocidade", fmt(drone.speed, 1), " km/h"], ["Próximo voo", drone.nextTask ? clockFormat.format(drone.nextTask.start) : "—"]]}
        />
        <AgentCard
          href="#/agente/agbot" icon={<Bot size={20} strokeWidth={1.8} />} name="AgBot" tone={agbot.task ? "live" : "idle"} status={agbot.phase} now={now} task={agbot.task}
          figures={[["Bateria", fmt(status.battery_percent, 0), "%"], ["Módulo", findModule(status.active_module)?.code ?? "—"], ["Velocidade", fmt(status.speed_kmh, 1), " km/h"], ["Próxima tarefa", agbot.nextTask ? clockFormat.format(agbot.nextTask.start) : "—"]]}
        />
      </div>

      <div className="dash-main">
        <div className="dash-charts">
          <Panel icon={<Gauge size={15} />} title="Bateria do AgBot"><DayChart title="Bateria do AgBot" points={batteryBot} color="#416c41" tStart={day.start} tEnd={day.end} /></Panel>
          <Panel icon={<DroneIcon size={15} />} title="Bateria do Infodrone"><DayChart title="Bateria do Infodrone" points={batteryDrone} color="#6a5aa8" tStart={day.start} tEnd={day.end} /></Panel>
          <Panel icon={<Plug size={15} />} title="Carga elétrica"><DayChart title="Carga" unit=" kW" points={load} color="#d4673e" tStart={day.start} tEnd={day.end} limits={[0, 1.5]} /></Panel>
          <Panel icon={<Droplets size={15} />} title="Umidade do solo"><DayChart title="Umidade do solo" points={moistureSeries} color="#2a78d6" tStart={day.start} tEnd={day.end} limits={[20, 50]} /></Panel>
        </div>
        <Panel icon={<Bell size={15} />} title="Avisos e próximos passos" tag={warnings ? "atenção" : undefined}>
          <Alerts items={hub.alerts} />
        </Panel>
      </div>

      <Agenda day={day} now={now} cursor={null} selectedId={replayTaskId} onReplay={onReplay} onLive={onLive} />
    </section>
  );
}
