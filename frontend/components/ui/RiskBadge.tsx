type RiskLevel = 'Low' | 'Medium' | 'High';

export default function RiskBadge({ level }: { level: RiskLevel }) {
  const classes: Record<RiskLevel, string> = {
    Low: 'badge-low',
    Medium: 'badge-medium',
    High: 'badge-high',
  };
  const emoji: Record<RiskLevel, string> = {
    Low: '✅',
    Medium: '⚠️',
    High: '🔴',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${classes[level]}`}>
      {emoji[level]} {level} Risk
    </span>
  );
}
