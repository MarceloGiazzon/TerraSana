import { Bot } from "lucide-react";
import { DRONE_SERVICES, findModule } from "./modules.js";
import DroneIcon from "./DroneIcon.jsx";

/** Ícone da função desempenhada: módulo do AgBot ou serviço do Infodrone. */
export function FunctionIcon({ task, size = 14 }) {
  if (task.agent === "drone") {
    const Icon = DRONE_SERVICES[task.service]?.icon ?? DroneIcon;
    return <Icon size={size} strokeWidth={1.8} />;
  }
  const Icon = findModule(task.module)?.icon ?? Bot;
  return <Icon size={size} strokeWidth={1.8} />;
}

export function AgentGlyph({ agent, size = 14 }) {
  return agent === "drone" ? <DroneIcon size={size} /> : <Bot size={size} strokeWidth={1.8} />;
}

/** Dois símbolos: quem executa (AgBot ou Infodrone) e a função desempenhada. */
export function TaskIcons({ task, size = 14 }) {
  const agentName = task.agent === "drone" ? "Infodrone" : "AgBot";
  const functionName = task.agent === "drone" ? DRONE_SERVICES[task.service]?.name : findModule(task.module)?.fullName;
  return (
    <span className="task-icons">
      <span className={`task-icon agent ${task.agent}`} title={agentName}><AgentGlyph agent={task.agent} size={size} /></span>
      <span className="task-icon fn" title={functionName}><FunctionIcon task={task} size={size} /></span>
    </span>
  );
}
