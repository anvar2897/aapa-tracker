// components/product/ProductTable.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import { ProfileBadge } from '@/components/common/ProfileBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FboAlert } from '@/components/common/FboAlert';
import type { ProductListRow } from '@/lib/queries';

type SortKey = 'score' | 'sku' | 'status' | 'stock';
type SortDir = 'asc' | 'desc';

type Props = {
  rows: ProductListRow[];
};

const profileLabels: Record<string, string> = {
  all: 'Все профили',
  accessories: 'Аксессуары',
  parts: 'Запчасти',
};

const statusLabels: Record<string, string> = {
  all: 'Все статусы',
  draft: 'Черновик',
  ready: 'Готов',
  on_sale: 'Продаётся',
  blocked: 'Заблокирован',
  archived: 'Архив',
};

export function ProductTable({ rows }: Props) {
  const router = useRouter();
  const [profileFilter, setProfileFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (profileFilter !== 'all' && r.productProfile !== profileFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, profileFilter, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'score') cmp = a.score.total - b.score.total;
      else if (sortKey === 'sku') cmp = a.sku.localeCompare(b.sku);
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortKey === 'stock') cmp = a.stockQuantity - b.stockQuantity;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown size={13} className="opacity-30" />;
    return sortDir === 'asc' ? (
      <ArrowUp size={13} className="text-amber-400" />
    ) : (
      <ArrowDown size={13} className="text-amber-400" />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={profileFilter}
          onChange={(e) => setProfileFilter(e.target.value)}
          className="text-sm rounded-md px-3 py-1.5 font-mono outline-none cursor-pointer"
          style={{
            backgroundColor: 'hsl(222 47% 15%)',
            color: 'hsl(213 31% 91%)',
            border: '1px solid hsl(216 34% 28%)',
          }}
        >
          {Object.entries(profileLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm rounded-md px-3 py-1.5 font-mono outline-none cursor-pointer"
          style={{
            backgroundColor: 'hsl(222 47% 15%)',
            color: 'hsl(213 31% 91%)',
            border: '1px solid hsl(216 34% 28%)',
          }}
        >
          {Object.entries(statusLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <span
          className="text-xs font-mono ml-auto"
          style={{ color: 'hsl(215 20% 55%)' }}
        >
          {sorted.length} из {rows.length} товаров
        </span>
      </div>

      {/* Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid hsl(216 34% 22%)' }}
      >
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ backgroundColor: 'hsl(222 47% 13%)', borderBottom: '1px solid hsl(216 34% 22%)' }}>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(215 20% 55%)', width: 48 }} />
              <th
                className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                style={{ color: 'hsl(215 20% 55%)' }}
                onClick={() => toggleSort('sku')}
              >
                <span className="flex items-center gap-1.5">SKU <SortIcon k="sku" /></span>
              </th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(215 20% 55%)' }}>
                Название
              </th>
              <th
                className="px-4 py-3 text-center font-medium cursor-pointer select-none"
                style={{ color: 'hsl(215 20% 55%)', width: 80 }}
                onClick={() => toggleSort('score')}
              >
                <span className="flex items-center justify-center gap-1.5">Score <SortIcon k="score" /></span>
              </th>
              <th
                className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                style={{ color: 'hsl(215 20% 55%)' }}
                onClick={() => toggleSort('status')}
              >
                <span className="flex items-center gap-1.5">Статус <SortIcon k="status" /></span>
              </th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(215 20% 55%)', width: 80 }}>
                Схема
              </th>
              <th
                className="px-4 py-3 text-right font-medium cursor-pointer select-none"
                style={{ color: 'hsl(215 20% 55%)', width: 80 }}
                onClick={() => toggleSort('stock')}
              >
                <span className="flex items-center justify-end gap-1.5">Остаток <SortIcon k="stock" /></span>
              </th>
              <th className="px-4 py-3 text-center font-medium" style={{ color: 'hsl(215 20% 55%)', width: 70 }}>
                FBO
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm"
                  style={{ color: 'hsl(215 20% 45%)' }}
                >
                  Нет товаров, соответствующих фильтрам
                </td>
              </tr>
            )}
            {sorted.map((row, idx) => (
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
                <td className="px-4 py-3">
                  <ProfileBadge profile={row.productProfile} />
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs" style={{ color: 'hsl(215 20% 65%)' }}>
                    {row.sku}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span style={{ color: 'hsl(213 31% 88%)' }}>{row.nameRu}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <ScoreBadge score={row.score.total} size={42} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs" style={{ color: 'hsl(215 20% 65%)' }}>
                    {row.scheme}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-sm" style={{ color: 'hsl(213 31% 88%)' }}>
                    {row.stockQuantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <FboAlert days={row.fboTurnoverDays} scheme={row.scheme} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
