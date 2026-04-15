type Accent = 'red' | 'amber' | 'green' | 'blue' | 'default';

const accentColors: Record<Accent, string> = {
  red: '#ef4444',
  amber: '#f59e0b',
  green: '#22c55e',
  blue: '#3b82f6',
  default: 'hsl(213 31% 91%)',
};

type Props = {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: Accent;
};

export function StatCard({ label, value, sublabel, accent = 'default' }: Props) {
  return (
    <div
      className="rounded-lg px-4 py-3 flex flex-col gap-1"
      style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
    >
      <span className="text-xs uppercase tracking-wider" style={{ color: 'hsl(215 20% 55%)' }}>
        {label}
      </span>
      <span
        className="text-2xl font-mono font-bold"
        style={{ color: accentColors[accent] }}
      >
        {value}
      </span>
      {sublabel && (
        <span className="text-xs" style={{ color: 'hsl(215 20% 45%)' }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}
