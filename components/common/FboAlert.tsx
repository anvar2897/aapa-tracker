// §5.3 Uzum: FBO free window = 60 days. Warn at 45, critical at 55.

import { FBO_TURNOVER_WARN_DAYS, FBO_TURNOVER_CRITICAL_DAYS } from '@/lib/constants';

type Props = {
  days: number | null;
  scheme: string;
};

export function FboAlert({ days, scheme }: Props) {
  if (scheme !== 'FBO' || days === null || days < FBO_TURNOVER_WARN_DAYS) {
    return null;
  }

  const isCritical = days >= FBO_TURNOVER_CRITICAL_DAYS;

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-mono font-medium"
      style={{ color: isCritical ? '#f87171' : '#fbbf24' }}
      title={`FBO оборачиваемость: ${days} дней (${isCritical ? 'критично' : 'предупреждение'})`}
    >
      <span>⚠</span>
      <span>{days}д</span>
    </span>
  );
}
