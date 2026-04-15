'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ProfileBadge } from '@/components/common/ProfileBadge';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import type { AuditIssue } from '@/lib/queries';

const issueLabels: Record<string, string> = {
  blocked: 'Заблокирован',
  missing_bilingual: 'Нет двуязычного названия',
  photos_non_compliant: 'Фото не соответствуют требованиям',
  low_score: 'Score < 50',
  parts_no_compatible_models: 'Нет совместимых моделей (запчасть)',
  no_filter_properties: 'Нет фильтровых свойств',
  no_price: 'Цена не указана',
  accessories_few_photos: 'Меньше 3 фото (аксессуар)',
  accessories_no_use_case: 'Нет описания применения (аксессуар)',
  no_video: 'Нет видео',
  parts_no_oem: 'Нет OEM-номера (запчасть)',
  fbo_approaching: 'FBO ≥45 дней — заканчивается бесплатный период',
};

const severityColors: Record<'critical' | 'high' | 'medium' | 'low', { bg: string; border: string; dot: string; label: string }> = {
  critical: { bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.2)',   dot: '#ef4444', label: 'Критично' },
  high:     { bg: 'rgba(234,179,8,0.06)',   border: 'rgba(234,179,8,0.2)',   dot: '#eab308', label: 'Высокий' },
  medium:   { bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.2)',  dot: '#f59e0b', label: 'Средний' },
  low:      { bg: 'rgba(59,130,246,0.06)',  border: 'rgba(59,130,246,0.2)', dot: '#3b82f6', label: 'Низкий' },
};

type Props = {
  severity: 'critical' | 'high' | 'medium' | 'low';
  issues: AuditIssue[];
};

export function AuditSection({ severity, issues }: Props) {
  const [open, setOpen] = useState(severity === 'critical' || severity === 'high');
  const router = useRouter();
  const colors = severityColors[severity];

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.bg }}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: colors.dot }}
          />
          <span className="text-sm font-medium" style={{ color: 'hsl(213 31% 91%)' }}>
            {colors.label}
          </span>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{ backgroundColor: 'hsl(222 47% 15%)', color: 'hsl(215 20% 65%)' }}
          >
            {issues.length}
          </span>
        </div>
        {open
          ? <ChevronDown size={14} style={{ color: 'hsl(215 20% 55%)' }} />
          : <ChevronRight size={14} style={{ color: 'hsl(215 20% 55%)' }} />
        }
      </button>

      {open && issues.length > 0 && (
        <div style={{ borderTop: `1px solid ${colors.border}` }}>
          {issues.map((issue, idx) => (
            <div
              key={`${issue.type}-${issue.productId}`}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
              style={{
                borderBottom: idx < issues.length - 1 ? `1px solid ${colors.border}` : undefined,
                backgroundColor: 'transparent',
              }}
              onClick={() => router.push(`/products/${issue.productId}`)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'hsl(222 47% 15%)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
              }}
            >
              <ProfileBadge profile={issue.productProfile} />
              <span className="font-mono text-xs w-24 shrink-0" style={{ color: 'hsl(215 20% 55%)' }}>
                {issue.sku}
              </span>
              <span className="text-sm flex-1 truncate" style={{ color: 'hsl(213 31% 88%)' }}>
                {issue.nameRu}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded shrink-0"
                style={{ backgroundColor: 'hsl(222 47% 13%)', color: 'hsl(215 20% 55%)' }}
              >
                {issueLabels[issue.type] ?? issue.type}
              </span>
              <ScoreBadge score={issue.score} size={36} />
            </div>
          ))}
        </div>
      )}

      {open && issues.length === 0 && (
        <div
          className="px-4 py-3 text-sm"
          style={{ borderTop: `1px solid ${colors.border}`, color: '#22c55e' }}
        >
          Нет проблем ✓
        </div>
      )}
    </div>
  );
}
