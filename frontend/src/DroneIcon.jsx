// Ícone de quadricóptero no mesmo traço dos ícones lucide.
export default function DroneIcon({ size = 16, strokeWidth = 1.8, className = "" }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
      <path d="M9.5 9.5 6.5 6.5M14.5 9.5l3-3M9.5 14.5l-3 3M14.5 14.5l3 3" />
      <circle cx="5.5" cy="5.5" r="2.8" />
      <circle cx="18.5" cy="5.5" r="2.8" />
      <circle cx="5.5" cy="18.5" r="2.8" />
      <circle cx="18.5" cy="18.5" r="2.8" />
    </svg>
  );
}
