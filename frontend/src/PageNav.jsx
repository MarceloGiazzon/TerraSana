import { Bot, LayoutDashboard, Map as MapIcon, Server } from "lucide-react";
import DroneIcon from "./DroneIcon.jsx";

export const AGENTS = [
  { id: "hub", name: "AgHub", subtitle: "Estação central", icon: <Server size={17} strokeWidth={1.8} /> },
  { id: "drone", name: "Infodrone", subtitle: "Reconhecimento aéreo", icon: <DroneIcon size={17} /> },
  { id: "agbot", name: "AgBot", subtitle: "Robô de campo modular", icon: <Bot size={17} strokeWidth={1.8} /> },
];

/** Navegação entre o painel, o dashboard e as páginas dos agentes (modo demonstração). */
export default function PageNav({ current }) {
  const items = [
    { id: "painel", name: "Painel", href: "#/", icon: <MapIcon size={16} strokeWidth={1.8} /> },
    { id: "dashboard", name: "Dashboard", href: "#/dashboard", icon: <LayoutDashboard size={16} strokeWidth={1.8} /> },
    ...AGENTS.map((agent) => ({ id: agent.id, name: agent.name, href: `#/agente/${agent.id}`, icon: agent.icon })),
  ];
  return (
    <nav className="page-nav" aria-label="Páginas do painel">
      {items.map((item) => (
        <a key={item.id} href={item.href} className={item.id === current ? "selected" : ""} aria-current={item.id === current ? "page" : undefined}>{item.icon}<span>{item.name}</span></a>
      ))}
    </nav>
  );
}
