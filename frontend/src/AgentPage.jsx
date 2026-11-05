import { useMemo } from "react";
import {
  Activity, Battery, BatteryCharging, Bell, Bot, CircleCheck, Clock, CloudFog, CloudSun, Cpu, Database, Droplets, Gauge, Info, Layers, ListChecks,
  Lock, MapPin, Navigation, Package, Plug, Radio, Router, Satellite, Server, Sprout, Sun, Thermometer, TriangleAlert, Wind,
} from "lucide-react";
import { TaskGroups } from "./Agenda.jsx";
import { Alerts, Big, DayChart, Meter, Panel, Pill, Rows, clockFormat, duration, fmt, tasksSummary, useDaySeries } from "./ui.jsx";
import DroneIcon from "./DroneIcon.jsx";
import { DRONE_SERVICES, MODULES, findModule, moduleTelemetry } from "./modules.js";
import PageNav, { AGENTS } from "./PageNav.jsx";
import { hubDetails } from "./hub.js";
import { agbotBattery, agbotState, droneState } from "./simulate.js";

// ---------- Páginas ----------
function AgBotPage({ day, now, onReplay, onLive }) {
  const state = useMemo(() => agbotState(day, now), [day, now]);
  const drone = useMemo(() => droneState(day, now), [day, now]);
  const { payload } = state;
  const status = payload.status;
  const activeModule = findModule(status.active_module);
  const data = moduleTelemetry(payload, activeModule);
  const summary = tasksSummary(day.agbot, now);
  const battery = useDaySeries(day, now, (t) => agbotBattery(day, t));

  const alerts = [];
  if (status.e_stop) alerts.push({ level: "warn", text: "Parada de emergência acionada" });
  if (status.battery_percent < 30) alerts.push({ level: "warn", text: `Bateria baixa: ${fmt(status.battery_percent, 0)}%` });
  if (state.task && status.battery_percent < 45) alerts.push({ level: "info", text: `Bateria em ${fmt(status.battery_percent, 0)}%: recarga na doca ao fim da tarefa` });
  if (state.nextTask) alerts.push({ level: "info", text: `Próxima tarefa: ${findModule(state.nextTask.module)?.code} · ${state.nextTask.title}`, at: state.nextTask.start });
  if (!state.task) alerts.push({ level: "info", text: "AgBot na doca: nenhum módulo acoplado" });

  return (
    <>
      <div className="ap-grid">
        <Panel icon={<Activity size={15} />} title="Status" tag={state.task ? "em operação" : "na doca"}>
          <div className="ap-bigs">
            <Big label="Situação" value={state.phase} tone="text" />
            <Big label="Bateria" value={fmt(status.battery_percent, 0)} unit="%" tone={status.battery_percent < 30 ? "warn" : ""} />
            <Big label="Velocidade" value={fmt(status.speed_kmh, 1)} unit=" km/h" />
          </div>
          <Meter label="Bateria" percent={status.battery_percent} />
          <Rows items={[
            ["Módulo acoplado", activeModule ? `${activeModule.code} · ${activeModule.name}` : "Nenhum"],
            ["Tarefa", state.task ? `${state.task.title} · ${state.task.zone}` : "Aguardando"],
            ["Previsão de término", state.task ? clockFormat.format(state.task.end) : null],
            ["Parada de emergência", status.e_stop ? "Acionada" : "Normal"],
            ["Identificador", payload.robot_id],
          ]} />
        </Panel>

        <Panel icon={<MapPin size={15} />} title="Posição e ambiente">
          <Rows items={[
            ["Latitude", `${payload.location.latitude.toFixed(6)}°`],
            ["Longitude", `${payload.location.longitude.toFixed(6)}°`],
            ["Altitude", fmt(payload.location.altitude_m, 1), " m"],
            ["Precisão", "RTK fixo · 2 cm"],
            ["Umidade do solo", fmt(payload.environmental.soil_moisture_percent, 1), "%"],
            ["Temperatura do ar", fmt(payload.environmental.ambient_temp_c, 1), " °C"],
            ["Percorrido na tarefa", state.sample ? fmt(state.sample.distance, 0) : null, " m"],
          ]} />
        </Panel>

        <Panel icon={<Layers size={15} />} title="Módulo acoplado" tag={activeModule?.code}>
          {activeModule ? (
            <>
              <p className="ap-lead">{activeModule.fullName}</p>
              <Rows items={activeModule.metrics.map((metric) => [metric.label, metric.format ? (data[metric.key] == null ? null : metric.format(data[metric.key])) : fmt(data[metric.key], 2), metric.unit])} />
            </>
          ) : <p className="ap-muted">Nenhum módulo acoplado. Os módulos são trocados na doca, um por vez.</p>}
        </Panel>

        <Panel icon={<ListChecks size={15} />} title="Resumo do dia">
          <div className="ap-bigs two">
            <Big label="Tarefas" value={`${summary.done}/${summary.total}`} sub={summary.running ? "1 em andamento" : "concluídas"} />
            <Big label="Em operação" value={duration(summary.worked)} />
          </div>
          <Rows items={[["Distância percorrida", fmt(summary.distance, 0), " m"], ["Infodrone", drone.phase]]} />
        </Panel>

        <Panel icon={<Bell size={15} />} title="Avisos" tag={alerts.filter((a) => a.level === "warn").length ? "atenção" : undefined}>
          <Alerts items={alerts} />
        </Panel>

        <Panel icon={<Package size={15} />} title="Módulos do AgBot" tag="um acoplado por vez">
          <ul className="ap-modules">
            {MODULES.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule?.id === module.id;
              const upcoming = !isActive && state.nextTask?.module === module.id;
              const label = isActive ? "Acoplado" : upcoming ? `A seguir · ${clockFormat.format(state.nextTask.start)}` : "Na prateleira";
              return (
                <li key={module.id} className={isActive ? "active" : upcoming ? "next" : ""}>
                  {isActive || upcoming ? <Icon size={14} /> : <Lock size={13} />}
                  <span><b>{module.code} · {module.name}</b><small>{label}</small></span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel icon={<Battery size={15} />} title="Bateria ao longo do dia" wide>
          <DayChart title="Bateria do AgBot" points={battery} color="#416c41" tStart={day.start} tEnd={day.end} />
        </Panel>
      </div>

      <section className="ap-section">
        <h2>Atividades do AgBot</h2>
        <TaskGroups tasks={day.agbot} now={now} selectedId={state.task?.id} onReplay={onReplay} onLive={onLive} showAgent={false} />
      </section>
    </>
  );
}

function DronePage({ day, now, onReplay, onLive }) {
  const state = useMemo(() => droneState(day, now), [day, now]);
  const hub = useMemo(() => hubDetails(day, now), [day, now]);
  const summary = tasksSummary(day.drone, now);
  const battery = useDaySeries(day, now, (t) => droneState(day, t).battery);
  const altitude = useDaySeries(day, now, (t) => droneState(day, t).altitude);
  const [lng, lat] = state.lngLat;
  const flying = Boolean(state.task);

  const alerts = [];
  if (state.battery < 25) alerts.push({ level: "warn", text: `Bateria baixa: ${fmt(state.battery, 0)}%` });
  if (flying && state.battery < 45) alerts.push({ level: "info", text: `Bateria em ${fmt(state.battery, 0)}%: retorno ao ninho ao fim do voo` });
  if (state.nextTask) alerts.push({ level: "info", text: `Próximo voo: ${state.nextTask.title}`, at: state.nextTask.start });
  if (!flying) alerts.push({ level: "info", text: "Infodrone no ninho, carregando e pronto para o próximo voo" });
  if (!state.nextTask && !flying) alerts.push({ level: "info", text: "Nenhum voo restante na agenda de hoje" });

  return (
    <>
      <div className="ap-grid">
        <Panel icon={<Activity size={15} />} title="Status" tag={flying ? "em voo" : "no ninho"}>
          <div className="ap-bigs">
            <Big label="Situação" value={state.phase} tone="text" />
            <Big label="Bateria" value={fmt(state.battery, 0)} unit="%" tone={state.battery < 25 ? "warn" : ""} />
            <Big label="Altitude" value={fmt(state.altitude, 0)} unit=" m" />
          </div>
          <Meter label="Bateria" percent={state.battery} />
          <Rows items={[
            ["Voo atual", state.task ? state.task.title : "Nenhum"],
            ["Área", state.task?.zone],
            ["Previsão de término", state.task ? clockFormat.format(state.task.end) : null],
            ["Velocidade", fmt(state.speed, 1), " km/h"],
            ["Ninho", hub.docks.drone.lid === "fechada" ? "Tampa fechada · carregando" : "Tampa aberta"],
          ]} />
        </Panel>

        <Panel icon={<Navigation size={15} />} title="Posição">
          <Rows items={[
            ["Latitude", `${lat.toFixed(6)}°`],
            ["Longitude", `${lng.toFixed(6)}°`],
            ["Altitude de voo", fmt(state.altitude, 0), " m"],
            ["Distância do AgHub", state.sample ? fmt(Math.hypot(state.sample.u + 23, state.sample.v - 13), 0) : "11", " m"],
            ["Posicionamento", "GNSS + RTK"],
          ]} />
        </Panel>

        <Panel icon={<Gauge size={15} />} title="Enlace e carga útil">
          <Rows items={[
            ["Sinal do AgHub", `${hub.network.clients[1].rssi} dBm`],
            ["Câmera multiespectral", flying && state.task?.service === "ndvi" ? "Capturando" : "Em espera"],
            ["Nebulizador", flying && state.task?.service === "nebulizacao" && state.phase.startsWith("Nebuliz") ? "Ligado" : "Desligado"],
            ["Bateria no ninho", fmt(hub.docks.drone.battery, 0), "%"],
            ["Carga", flying ? "Em voo" : `${fmt(hub.docks.drone.chargingKw, 2)} kW`],
          ]} />
        </Panel>

        <Panel icon={<ListChecks size={15} />} title="Resumo do dia">
          <div className="ap-bigs two">
            <Big label="Voos" value={`${summary.done}/${summary.total}`} sub={summary.running ? "1 em andamento" : "concluídos"} />
            <Big label="Tempo de voo" value={duration(summary.worked)} />
          </div>
          <ul className="ap-services">
            {Object.values(DRONE_SERVICES).map((service) => {
              const Icon = service.icon;
              const flights = day.drone.filter((task) => task.service === service.id);
              return (
                <li key={service.id}><Icon size={14} /><span><b>{service.name}</b><small>{flights.map((f) => clockFormat.format(f.start)).join(" · ")}</small></span></li>
              );
            })}
          </ul>
        </Panel>

        <Panel icon={<Bell size={15} />} title="Avisos" tag={alerts.filter((a) => a.level === "warn").length ? "atenção" : undefined}>
          <Alerts items={alerts} />
        </Panel>

        <Panel icon={<Battery size={15} />} title="Bateria ao longo do dia">
          <DayChart title="Bateria do Infodrone" points={battery} color="#416c41" tStart={day.start} tEnd={day.end} />
        </Panel>

        <Panel icon={<DroneIcon size={15} />} title="Altitude ao longo do dia" wide>
          <DayChart title="Altitude" unit=" m" points={altitude} color="#6a5aa8" tStart={day.start} tEnd={day.end} limits={[0, 40]} />
        </Panel>
      </div>

      <section className="ap-section">
        <h2>Voos do Infodrone</h2>
        <TaskGroups tasks={day.drone} now={now} selectedId={state.task?.id} onReplay={onReplay} onLive={onLive} showAgent={false} />
      </section>
    </>
  );
}

function HubPage({ day, now, onReplay, onLive }) {
  const hub = useMemo(() => hubDetails(day, now), [day, now]);
  const { power, rtk, water, supplies, compute, network, weather, chamber, docks, data } = hub;
  const warnings = hub.alerts.filter((alert) => alert.level === "warn").length;
  const power24 = useDaySeries(day, now, (t) => hubDetails(day, t).power.loadKw);
  const waterSeries = useDaySeries(day, now, (t) => hubDetails(day, t).water.liters);

  return (
    <>
      <div className="ap-grid hub">
        <Panel icon={<Activity size={15} />} title="Visão geral" tag="estação central">
          <div className="ap-bigs">
            <Big label="Energia" value={power.source} tone="text" sub={`${fmt(power.voltage, 0)} V · ${fmt(power.frequency, 1)} Hz`} />
            <Big label="Posicionamento" value={rtk.fix} tone="text" sub={`${rtk.satellites} satélites`} />
            <Big label="Rede" value="Online" tone="text" sub={`${network.latencyMs} ms`} />
          </div>
          <Rows items={[
            ["Agentes conectados", `${network.clients.length} de ${network.clients.length}`],
            ["Avisos ativos", warnings ? `${warnings} de atenção` : "Nenhum"],
            ["Última cópia de segurança", clockFormat.format(data.lastBackup)],
            ["Tempo ligado", compute.uptime],
          ]} />
        </Panel>

        <Panel icon={<Plug size={15} />} title="Energia">
          <Rows items={[
            ["Fonte", power.source],
            ["Tensão da rede", fmt(power.voltage, 0), " V"],
            ["Frequência", fmt(power.frequency, 2), " Hz"],
            ["Carga atual", fmt(power.loadKw, 2), " kW"],
            ["Consumo hoje", fmt(power.todayKwh, 1), " kWh"],
            ["Nobreak", `${power.upsPercent}% · ${power.upsAutonomyMin} min de autonomia`],
          ]} />
        </Panel>

        <Panel icon={<Satellite size={15} />} title="Base RTK / GNSS" tag="correção ativa">
          <Rows items={[
            ["Solução", rtk.fix],
            ["Satélites", rtk.satellites],
            ["Constelações", rtk.constellations],
            ["HDOP", fmt(rtk.hdop, 2)],
            ["Precisão", rtk.precisionCm, " cm"],
            ["Idade da correção", fmt(rtk.correctionAgeS, 1), " s"],
            ["Distância ao AgBot", rtk.baselineM, " m"],
          ]} />
        </Panel>

        <Panel icon={<Droplets size={15} />} title="Reservatório de água" tag={water.pump}>
          <Meter label="Nível" percent={water.percent} detail={`${water.liters} / ${water.capacity} L`} warnBelow={30} />
          <Rows items={[
            ["Usado hoje", fmt(water.usedTodayL, 1), " L"],
            ["Bomba", water.pump],
            ["Pressão", fmt(water.pressureBar, 2), " bar"],
            ["pH da água", fmt(water.quality.ph, 2)],
            ["Condutividade", fmt(water.quality.ec, 2), " mS/cm"],
          ]} />
        </Panel>

        <Panel icon={<Sprout size={15} />} title="Insumos">
          <Meter label="Silo de sementes" percent={supplies.seedsPercent} detail={`${supplies.seedsPercent}% · ${fmt(supplies.seedsKg, 1)} kg`} warnBelow={40} />
          <Meter label="Adubo" percent={supplies.fertilizerPercent} detail={`${supplies.fertilizerPercent}% · ${supplies.fertilizerKg} kg`} warnBelow={30} />
        </Panel>

        <Panel icon={<CloudSun size={15} />} title="Estação meteorológica" tag="telhado do galpão">
          <Rows items={[
            ["Temperatura", fmt(weather.temperatureC, 1), " °C"],
            ["Umidade do ar", weather.humidity, "%"],
            ["Vento", `${weather.windKmh} km/h ${weather.windDir}`],
            ["Chuva", fmt(weather.rainMm, 1), " mm/h"],
            ["Radiação solar", weather.solarWm2, " W/m²"],
            ["Pressão", weather.pressureHpa, " hPa"],
          ]} />
        </Panel>

        <Panel icon={<BatteryCharging size={15} />} title="Doca do AgBot" tag={docks.agbot.occupied ? "ocupada" : "vazia"}>
          <Meter label="Bateria do AgBot" percent={docks.agbot.battery} />
          <Rows items={[
            ["Situação", docks.agbot.occupied ? "AgBot na doca" : "AgBot em campo"],
            ["Carregamento", docks.agbot.occupied ? `${fmt(docks.agbot.chargingKw, 2)} kW` : "Livre"],
            [docks.agbot.occupied ? "Módulos" : "Módulo em campo", docks.agbot.module],
          ]} />
        </Panel>

        <Panel icon={<DroneIcon size={15} />} title="Ninho do Infodrone" tag={docks.drone.occupied ? "ocupado" : "vazio"}>
          <Meter label="Bateria do Infodrone" percent={docks.drone.battery} />
          <Rows items={[
            ["Situação", docks.drone.occupied ? "Infodrone no ninho" : "Infodrone em voo"],
            ["Tampa", docks.drone.lid],
            ["Carregamento", docks.drone.occupied ? `${fmt(docks.drone.chargingKw, 2)} kW` : "Livre"],
          ]} />
        </Panel>

        <Panel icon={<Router size={15} />} title="Rede e comunicação">
          <Rows items={[
            ["Wi-Fi", network.ssid],
            ["Broker MQTT", network.broker],
            ["Backend", network.backend],
            ["Latência", network.latencyMs, " ms"],
            ["Mensagens", network.messagesPerMin, " /min"],
          ]} />
          <ul className="ap-clients">
            {network.clients.map((client) => (
              <li key={client.name}><i /><b>{client.name}</b><small>{client.note}</small><span>{client.rssi != null ? `${client.rssi} dBm` : "—"}</span></li>
            ))}
          </ul>
        </Panel>

        <Panel icon={<Cpu size={15} />} title="Computador do AgHub">
          <Meter label="Processador" percent={compute.cpu} warnBelow={0} />
          <Meter label="Memória" percent={compute.memory} warnBelow={0} />
          <Meter label="Disco" percent={compute.disk} warnBelow={0} />
          <Rows items={[["Temperatura", compute.temperatureC, " °C"], ["Tempo ligado", compute.uptime]]} />
        </Panel>

        <Panel icon={<Database size={15} />} title="Dados">
          <Rows items={[
            ["Leituras hoje", fmt(data.readingsToday, 0)],
            ["Banco SQLite", fmt(data.dbMb, 1), " MB"],
            ["Última cópia", clockFormat.format(data.lastBackup)],
            ["Retenção", data.retention],
          ]} />
        </Panel>

        <Panel icon={<CloudFog size={15} />} title="Câmara de cogumelos" tag="climatização">
          <Rows items={[
            ["Temperatura", fmt(chamber.temperatureC, 1), " °C"],
            ["Umidade do ar", chamber.humidity, "%"],
            ["CO₂", chamber.co2, " ppm"],
            ["Nebulizador", chamber.fogger ? "Ligado" : "Desligado"],
          ]} />
        </Panel>

        <Panel icon={<Bell size={15} />} title="Avisos" tag={warnings ? "atenção" : undefined}>
          <Alerts items={hub.alerts} />
        </Panel>

        <Panel icon={<Sun size={15} />} title="Carga elétrica ao longo do dia">
          <DayChart title="Carga" unit=" kW" points={power24} color="#d4673e" tStart={day.start} tEnd={day.end} limits={[0, 1.5]} />
        </Panel>
        <Panel icon={<Droplets size={15} />} title="Água ao longo do dia">
          <DayChart title="Reservatório" unit=" L" points={waterSeries} color="#2a78d6" tStart={day.start} tEnd={day.end} limits={[300, 500]} />
        </Panel>

        <Panel icon={<Clock size={15} />} title="Registro de eventos" wide>
          <ul className="ap-events">
            {hub.events.map((event) => (
              <li key={`${event.t}-${event.text}`} className={event.level}>
                <time>{clockFormat.format(event.t)}</time>
                <span className={`ap-event-kind ${event.kind}`}>{event.kind === "hub" ? "AgHub" : event.kind === "drone" ? "Infodrone" : "AgBot"}</span>
                <span>{event.text}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <section className="ap-section">
        <h2>Atividades de todos os agentes</h2>
        <TaskGroups tasks={day.all} now={now} selectedId={null} onReplay={onReplay} onLive={onLive} />
      </section>
    </>
  );
}

/** Página de detalhes de um agente: status, avisos e atividades. */
export default function AgentPage({ agentId, day, now, onReplay, onLive }) {
  const agent = AGENTS.find((item) => item.id === agentId);
  const agbot = useMemo(() => agbotState(day, now), [day, now]);
  const drone = useMemo(() => droneState(day, now), [day, now]);
  const headline = {
    hub: { tone: "ok", text: "Sempre ativo · estação central online" },
    drone: drone.task ? { tone: "live", text: `${drone.phase} · ${drone.task.title}` } : { tone: "idle", text: drone.phase },
    agbot: agbot.task ? { tone: "live", text: `${agbot.phase} · ${findModule(agbot.task.module)?.code} ${agbot.task.title}` } : { tone: "idle", text: agbot.phase },
  }[agentId];
  const Page = { hub: HubPage, drone: DronePage, agbot: AgBotPage }[agentId];

  return (
    <section className="agent-page" aria-labelledby="agent-title">
      <PageNav current={agentId} />
      <header className="ap-header">
        <span className="ap-avatar">{agent.icon}</span>
        <div>
          <p className="eyebrow">AGENTE <span> / </span> {agent.subtitle.toUpperCase()}</p>
          <h1 id="agent-title">{agent.name}</h1>
        </div>
        <Pill tone={headline.tone}>{headline.text}</Pill>
        <span className="ap-updated"><Radio size={13} /> {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now)}</span>
      </header>
      <Page day={day} now={now} onReplay={onReplay} onLive={onLive} />
    </section>
  );
}
