'use client';

import { useRouter } from 'next/navigation';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import { ProfileBadge } from '@/components/common/ProfileBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { ProductListRow } from '@/lib/queries';

type Props = {
  alerts: ProductListRow[];
};

export function AlertsTable({ alerts }: Props) {
  const router = useRouter();

  if (alerts.length === 0) {
    return (
      <div
        className="rounded-lg px-4 py-6 text-center text-sm"
        style={{
          backgroundColor: 'hsl(222 47% 15%)',
          border: '1px solid hsl(216 34% 22%)',
          color: '#22c55e',
        }}
      >
        All products score ≥ 50 ✓
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid hsl(216 34% 22%)' }}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ backgroundColor: 'hsl(222 47% 13%)', borderBottom: '1px solid hsl(216 34% 22%)' }}>
            <th className="px-4 py-3 text-left font-medium w-10" style={{ color: 'hsl(215 20% 55%)' }} />
            <th className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(215 20% 55%)' }}>SKU</th>
            <th className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(215 20% 55%)' }}>Название</th>
            <th className="px-4 py-3 text-center font-medium w-20" style={{ color: 'hsl(215 20% 55%)' }}>Score</th>
            <th className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(215 20% 55%)' }}>Статус</th>
            <th className="px-4 py-3 text-left font-medium w-16" style={{ color: 'hsl(215 20% 55%)' }}>Схема</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((row, idx) => (
            <tr
              key={row.id}
              className="transition-colors cursor-pointer"
              style={{
                backgroundColor: idx % 2 === 0 ? 'hsl(222 47% 12%)' : 'hsl(222 47% 11%)',
                borderBottom: '1px solid hsl(216 34% 19%)',
              }}
              onClick={() => router.push(`/products/${row.id}`)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'hsl(222 47% 16%)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                  idx % 2 === 0 ? 'hsl(222 47% 12%)' : 'hsl(222 47% 11%)';
              }}
            >
              <td className="px-4 py-3"><ProfileBadge profile={row.productProfile} /></td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs" style={{ color: 'hsl(215 20% 65%)' }}>{row.sku}</span>
              </td>
              <td className="px-4 py-3" style={{ color: 'hsl(213 31% 88%)' }}>{row.nameRu}</td>
              <td className="px-4 py-3">
                <div className="flex justify-center"><ScoreBadge score={row.score.total} size={42} /></div>
              </td>
              <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs" style={{ color: 'hsl(215 20% 65%)' }}>{row.scheme}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
