// components/product/ProductTable.tsx
'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import { ProfileBadge } from '@/components/common/ProfileBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FboAlert } from '@/components/common/FboAlert';
import { bulkUpdateStatus } from '@/app/actions/products';
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

const bulkStatusOptions: { value: 'draft' | 'ready' | 'on_sale' | 'blocked' | 'archived'; label: string }[] = [
  { value: 'draft',    label: 'Черновик' },
  { value: 'ready',   label: 'Готов' },
  { value: 'on_sale', label: 'Продаётся' },
  { value: 'blocked', label: 'Заблокирован' },
  { value: 'archived',label: 'Архив' },
];

export function ProductTable({ rows }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [profileFilter, setProfileFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [schemeFilter, setSchemeFilter] = useState<string>('all');
  const [scoreBand, setScoreBand] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkError, setBulkError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (profileFilter !== 'all' && r.productProfile !== profileFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (schemeFilter !== 'all' && r.scheme !== schemeFilter) return false;
      if (scoreBand !== 'all') {
        const s = r.score.total;
        if (scoreBand === 'red'    && !(s < 50))            return false;
        if (scoreBand === 'yellow' && !(s >= 50 && s < 70)) return false;
        if (scoreBand === 'blue'   && !(s >= 70 && s < 90)) return false;
        if (scoreBand === 'green'  && !(s >= 90))           return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!r.sku.toLowerCase().includes(q) && !r.nameRu.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, profileFilter, statusFilter, schemeFilter, scoreBand, search]);

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

  const filteredIds = useMemo(() => new Set(sorted.map((r) => r.id)), [sorted]);
  const allFilteredSelected = sorted.length > 0 && sorted.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function toggleRow(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      setSelected((prev) => {
        const next = new Set(prev);
        sorted.forEach((r) => next.add(r.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        sorted.forEach((r) => next.delete(r.id));
        return next;
      });
    }
  }

  function handleBulkStatus(status: 'draft' | 'ready' | 'on_sale' | 'blocked' | 'archived') {
    setBulkError(null);
    const ids = Array.from(selected).filter((id) => filteredIds.has(id));
    startTransition(async () => {
      const r = await bulkUpdateStatus(ids, status);
      if ('error' in r) {
        setBulkError(r.error);
      } else {
        setSelected(new Set());
        router.refresh();
      }
    });
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

        <select
          value={schemeFilter}
          onChange={(e) => setSchemeFilter(e.target.value)}
          className="text-sm rounded-md px-3 py-1.5 font-mono outline-none cursor-pointer"
          style={{
            backgroundColor: 'hsl(222 47% 15%)',
            color: 'hsl(213 31% 91%)',
            border: '1px solid hsl(216 34% 28%)',
          }}
        >
          <option value="all">Все схемы</option>
          <option value="FBS">FBS</option>
          <option value="FBO">FBO</option>
          <option value="DBS">DBS</option>
          <option value="EDBS">EDBS</option>
        </select>

        <select
          value={scoreBand}
          onChange={(e) => setScoreBand(e.target.value)}
          className="text-sm rounded-md px-3 py-1.5 font-mono outline-none cursor-pointer"
          style={{
            backgroundColor: 'hsl(222 47% 15%)',
            color: 'hsl(213 31% 91%)',
            border: '1px solid hsl(216 34% 28%)',
          }}
        >
          <option value="all">Все score</option>
          <option value="red">{'<50 (красный)'}</option>
          <option value="yellow">50–69 (жёлтый)</option>
          <option value="blue">70–89 (синий)</option>
          <option value="green">90–100 (зелёный)</option>
        </select>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по SKU или названию…"
          className="text-sm rounded-md px-3 py-1.5 outline-none font-mono"
          style={{
            backgroundColor: 'hsl(222 47% 15%)',
            color: 'hsl(213 31% 91%)',
            border: '1px solid hsl(216 34% 28%)',
            minWidth: 220,
          }}
        />

        <span
          className="text-xs font-mono ml-auto"
          style={{ color: 'hsl(215 20% 55%)' }}
        >
          {sorted.length} из {rows.length} товаров
        </span>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-md"
          style={{
            backgroundColor: 'hsl(222 47% 17%)',
            border: '1px solid hsl(216 34% 28%)',
          }}
        >
          <span className="text-sm font-mono" style={{ color: 'hsl(213 31% 80%)' }}>
            Выбрано: {selected.size}
          </span>
          <span className="text-xs" style={{ color: 'hsl(215 20% 45%)' }}>
            Изменить статус:
          </span>
          {bulkStatusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleBulkStatus(opt.value)}
              disabled={isPending}
              className="text-xs px-3 py-1 rounded cursor-pointer disabled:opacity-50 transition-colors hover:text-amber-400"
              style={{
                backgroundColor: 'hsl(222 47% 12%)',
                color: 'hsl(213 31% 75%)',
                border: '1px solid hsl(216 34% 22%)',
              }}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs cursor-pointer hover:text-red-400 transition-colors"
            style={{ color: 'hsl(215 20% 45%)' }}
          >
            Снять выбор
          </button>
          {bulkError && (
            <span className="text-xs text-red-400">{bulkError}</span>
          )}
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid hsl(216 34% 22%)' }}
      >
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ backgroundColor: 'hsl(222 47% 13%)', borderBottom: '1px solid hsl(216 34% 22%)' }}>
              <th className="px-4 py-3 text-left" style={{ width: 36 }}>
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAll}
                  className="cursor-pointer"
                  style={{ accentColor: '#f59e0b' }}
                />
              </th>
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
                  colSpan={9}
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
                  backgroundColor: selected.has(row.id)
                    ? 'hsl(222 47% 18%)'
                    : idx % 2 === 0 ? 'hsl(222 47% 12%)' : 'hsl(222 47% 11%)',
                  borderBottom: '1px solid hsl(216 34% 19%)',
                }}
                onClick={() => router.push(`/products/${row.id}`)}
                onMouseEnter={(e) => {
                  if (!selected.has(row.id)) {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'hsl(222 47% 16%)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor = selected.has(row.id)
                    ? 'hsl(222 47% 18%)'
                    : idx % 2 === 0 ? 'hsl(222 47% 12%)' : 'hsl(222 47% 11%)';
                }}
              >
                <td className="px-4 py-3" onClick={(e) => toggleRow(row.id, e)}>
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => {}}
                    className="cursor-pointer"
                    style={{ accentColor: '#f59e0b' }}
                  />
                </td>
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
