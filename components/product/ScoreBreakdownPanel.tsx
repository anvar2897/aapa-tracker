import { Check, X } from 'lucide-react';
import type { ScoreBreakdown } from '@/lib/scoring';

export function ScoreBreakdownPanel({ score }: { score: ScoreBreakdown }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs uppercase tracking-wider font-medium" style={{ color: 'hsl(215 20% 55%)' }}>
          Разбор score
        </span>
        <span className="font-mono text-xs" style={{ color: 'hsl(215 20% 65%)' }}>
          {score.total}/{score.maxPossible}
        </span>
      </div>
      <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
        {score.fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {f.met ? (
                <Check size={12} className="shrink-0" style={{ color: '#22c55e' }} />
              ) : (
                <X size={12} className="shrink-0" style={{ color: '#ef4444' }} />
              )}
              <span
                className="truncate"
                style={{ color: f.met ? 'hsl(213 31% 85%)' : 'hsl(215 20% 55%)' }}
              >
                {f.label}
              </span>
            </div>
            <span
              className="font-mono shrink-0"
              style={{ color: f.met ? '#22c55e' : 'hsl(215 20% 45%)' }}
            >
              {f.earned}/{f.weight}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
