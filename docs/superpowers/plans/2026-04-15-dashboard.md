# AAPA Tracker — Phase 3: Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a live catalog health dashboard with stat cards, score distribution chart, tab completion chart, and a low-score alerts table.

**Architecture:** `getDashboardData()` added to `lib/queries.ts` calls the existing `getProductListRows()` and computes all stats in one pass. The server page passes the computed data to four pure client chart/display components. No extra DB queries beyond what `getProductListRows()` already does.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Recharts 3.x, existing Drizzle queries

---

## Context for implementers

- Working directory: `/Users/anvar/Documents/GitHub/aapa-tracker`
- DB seeded with 7 products (IDs 1–7): 5 accessories (ACC-001..ACC-005), 2 parts (PRT-001, PRT-002)
- `lib/queries.ts` exports `getProductListRows()` and `ProductListRow` type:
  ```typescript
  type ProductListRow = {
    id: number; sku: string; productProfile: 'accessories' | 'parts';
    nameRu: string; status: 'draft' | 'ready' | 'on_sale' | 'blocked' | 'archived';
    scheme: 'FBS' | 'FBO' | 'DBS' | 'EDBS'; stockQuantity: number;
    fboTurnoverDays: number | null; sellingPrice: number | null;
    photoCount: number; score: ScoreBreakdown;
  };
  ```
- `lib/scoring.ts` — `ScoreBreakdown.fields` shape: `{ label: string; weight: number; earned: number; met: boolean }[]`
- Exact field labels from scoring engine:
  - **Accessories**: 'Photos ≥3', 'Filter properties', 'Title RU', 'Title UZ', 'Description RU', 'Description UZ', 'Use case described', 'Properties RU ≥3', 'Properties UZ ≥3', 'Short description', 'Video present', 'All photos compliant', 'Brand', 'Bundle info (if applicable)', 'Primary photo (front view)', 'Weight & dimensions', 'Price set', 'Competitor price', 'VAT'
  - **Parts**: 'Compatible models', 'OEM number', 'Title RU', 'Title UZ', 'Filter properties', 'Photos ≥3', 'Properties RU ≥3', 'Properties UZ ≥3', 'Weight & dimensions', 'Brand', 'All photos compliant', 'Cross-references', 'Fitment position', 'Material/spec', 'Description RU', 'Description UZ', 'Short description', 'Warranty', 'Price set', 'Part dimensions', 'Primary photo (front view)', 'VAT'
- Recharts is installed: `"recharts": "^3.8.1"` — use `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`, `Cell`
- Inline-style palette (match existing):
  - page bg: `hsl(222 47% 11%)`
  - card bg: `hsl(222 47% 15%)`, border `hsl(216 34% 22%)`
  - primary text: `hsl(213 31% 91%)`
  - muted text: `hsl(215 20% 55%)`
  - amber accent: `#f59e0b`
- Tests: Vitest `environment: 'node'`, run `npm test`. Path alias `@/` → project root.
- `app/(app)/dashboard/page.tsx` already exists as a placeholder — **overwrite it**.

---

## File Map

**Modify:**
- `lib/queries.ts` — add `DashboardData` type + `getDashboardData()` function

**Create:**
- `lib/__tests__/dashboard.test.ts` — integration test for `getDashboardData`
- `components/dashboard/StatCard.tsx` — reusable stat pill
- `components/dashboard/ScoreDistributionChart.tsx` — Recharts bar chart (4 bands)
- `components/dashboard/TabCompletionChart.tsx` — Recharts horizontal bar (5 tabs)
- `components/dashboard/AlertsTable.tsx` — low-score table, clickable rows

**Overwrite:**
- `app/(app)/dashboard/page.tsx` — server component wiring everything together

---

## Task 1: `getDashboardData` query + test

**Files:**
- Modify: `lib/queries.ts`
- Create: `lib/__tests__/dashboard.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/dashboard.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getDashboardData } from '@/lib/queries';

describe('getDashboardData', () => {
  it('returns correct shape with seeded 7-product catalog', async () => {
    const data = await getDashboardData();

    // Shape
    expect(typeof data.stats.total).toBe('number');
    expect(typeof data.stats.avgScore).toBe('number');
    expect(typeof data.stats.lowScoreCount).toBe('number');
    expect(typeof data.stats.onSaleCount).toBe('number');
    expect(typeof data.stats.catalogRevenue).toBe('number');

    // Distribution totals match total products
    const distSum =
      data.distribution.red + data.distribution.yellow +
      data.distribution.blue + data.distribution.green;
    expect(distSum).toBe(data.stats.total);

    // 7 seeded products
    expect(data.stats.total).toBe(7);

    // tabCompletion: 5 groups, each has tab string + metPct 0-100
    expect(data.tabCompletion.length).toBe(5);
    for (const tc of data.tabCompletion) {
      expect(typeof tc.tab).toBe('string');
      expect(tc.metPct).toBeGreaterThanOrEqual(0);
      expect(tc.metPct).toBeLessThanOrEqual(100);
    }

    // alerts: all rows have score < 50
    for (const row of data.alerts) {
      expect(row.score.total).toBeLessThan(50);
    }

    // alerts sorted ascending by score
    for (let i = 1; i < data.alerts.length; i++) {
      expect(data.alerts[i].score.total).toBeGreaterThanOrEqual(data.alerts[i - 1].score.total);
    }
  });

  it('avgScore is within 0-100', async () => {
    const data = await getDashboardData();
    expect(data.stats.avgScore).toBeGreaterThanOrEqual(0);
    expect(data.stats.avgScore).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- dashboard.test.ts`
Expected: FAIL — `getDashboardData is not a function`

- [ ] **Step 3: Add `DashboardData` type and `getDashboardData` to `lib/queries.ts`**

Append to the **bottom** of `lib/queries.ts` (do NOT touch existing exports):

```typescript
// Tab field grouping for completion chart
const TAB_FIELD_GROUPS: { tab: string; labels: Set<string> }[] = [
  {
    tab: 'Карточка',
    labels: new Set([
      'Title RU', 'Title UZ', 'Description RU', 'Description UZ',
      'Short description', 'Brand', 'VAT', 'Weight & dimensions',
    ]),
  },
  {
    tab: 'Медиа',
    labels: new Set(['Photos ≥3', 'Video present', 'All photos compliant', 'Primary photo (front view)']),
  },
  {
    tab: 'Свойства',
    labels: new Set(['Filter properties', 'Properties RU ≥3', 'Properties UZ ≥3']),
  },
  {
    tab: 'Профиль',
    labels: new Set([
      'Use case described', 'OEM number', 'Compatible models', 'Cross-references',
      'Fitment position', 'Material/spec', 'Bundle info (if applicable)',
    ]),
  },
  {
    tab: 'Цены',
    labels: new Set(['Price set', 'Competitor price']),
  },
];

export type DashboardData = {
  stats: {
    total: number;
    avgScore: number;
    lowScoreCount: number;
    onSaleCount: number;
    catalogRevenue: number;
  };
  distribution: {
    red: number;
    yellow: number;
    blue: number;
    green: number;
  };
  tabCompletion: { tab: string; metPct: number }[];
  alerts: ProductListRow[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const rows = await getProductListRows();

  if (rows.length === 0) {
    return {
      stats: { total: 0, avgScore: 0, lowScoreCount: 0, onSaleCount: 0, catalogRevenue: 0 },
      distribution: { red: 0, yellow: 0, blue: 0, green: 0 },
      tabCompletion: TAB_FIELD_GROUPS.map(g => ({ tab: g.tab, metPct: 0 })),
      alerts: [],
    };
  }

  // Stats
  const total = rows.length;
  const avgScore = Math.round(rows.reduce((s, r) => s + r.score.total, 0) / total);
  const lowScoreCount = rows.filter(r => r.score.total < 50).length;
  const onSaleCount = rows.filter(r => r.status === 'on_sale').length;
  const catalogRevenue = rows.reduce((s, r) => s + (r.sellingPrice ?? 0), 0);

  // Distribution
  const distribution = { red: 0, yellow: 0, blue: 0, green: 0 };
  for (const r of rows) {
    const s = r.score.total;
    if (s < 50) distribution.red++;
    else if (s < 70) distribution.yellow++;
    else if (s < 90) distribution.blue++;
    else distribution.green++;
  }

  // Tab completion
  const tabCompletion = TAB_FIELD_GROUPS.map(group => {
    let metCount = 0;
    let totalCount = 0;
    for (const row of rows) {
      for (const field of row.score.fields) {
        if (group.labels.has(field.label)) {
          totalCount++;
          if (field.met) metCount++;
        }
      }
    }
    const metPct = totalCount === 0 ? 0 : Math.round((metCount / totalCount) * 100);
    return { tab: group.tab, metPct };
  });

  // Alerts: score < 50 sorted ascending
  const alerts = rows
    .filter(r => r.score.total < 50)
    .sort((a, b) => a.score.total - b.score.total);

  return { stats: { total, avgScore, lowScoreCount, onSaleCount, catalogRevenue }, distribution, tabCompletion, alerts };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- dashboard.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/queries.ts lib/__tests__/dashboard.test.ts
git commit -m "feat(lib): add getDashboardData query with stats, distribution, tab completion, alerts"
```

---

## Task 2: StatCard component

**Files:**
- Create: `components/dashboard/StatCard.tsx`

No automated test — visual component. Verify via dev server in Task 6.

- [ ] **Step 1: Create `components/dashboard/StatCard.tsx`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/StatCard.tsx
git commit -m "feat(dashboard): add StatCard component"
```

---

## Task 3: ScoreDistributionChart

**Files:**
- Create: `components/dashboard/ScoreDistributionChart.tsx`

- [ ] **Step 1: Create `components/dashboard/ScoreDistributionChart.tsx`**

```typescript
'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Props = {
  distribution: { red: number; yellow: number; blue: number; green: number };
};

const bands = [
  { key: 'red', label: '<50', color: '#ef4444' },
  { key: 'yellow', label: '50–69', color: '#eab308' },
  { key: 'blue', label: '70–89', color: '#3b82f6' },
  { key: 'green', label: '90–100', color: '#22c55e' },
] as const;

export function ScoreDistributionChart({ distribution }: Props) {
  const data = bands.map(b => ({ label: b.label, count: distribution[b.key], color: b.color }));
  const total = data.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[180px]" style={{ color: 'hsl(215 20% 45%)' }}>
        <span className="text-sm">No products yet</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{
            backgroundColor: 'hsl(222 47% 15%)',
            border: '1px solid hsl(216 34% 22%)',
            borderRadius: 6,
            color: 'hsl(213 31% 91%)',
            fontSize: 12,
          }}
          formatter={(value: number) => [value, 'Products']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/ScoreDistributionChart.tsx
git commit -m "feat(dashboard): add ScoreDistributionChart (Recharts bar)"
```

---

## Task 4: TabCompletionChart

**Files:**
- Create: `components/dashboard/TabCompletionChart.tsx`

- [ ] **Step 1: Create `components/dashboard/TabCompletionChart.tsx`**

```typescript
'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';

type Props = {
  tabCompletion: { tab: string; metPct: number }[];
};

export function TabCompletionChart({ tabCompletion }: Props) {
  if (tabCompletion.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px]" style={{ color: 'hsl(215 20% 45%)' }}>
        <span className="text-sm">No data yet</span>
      </div>
    );
  }

  // Sort descending (best at top)
  const data = [...tabCompletion].sort((a, b) => b.metPct - a.metPct);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
      >
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="tab"
          width={72}
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{
            backgroundColor: 'hsl(222 47% 15%)',
            border: '1px solid hsl(216 34% 22%)',
            borderRadius: 6,
            color: 'hsl(213 31% 91%)',
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value}%`, 'Completion']}
        />
        <Bar dataKey="metPct" radius={[0, 4, 4, 0]} fill="#f59e0b">
          <LabelList
            dataKey="metPct"
            position="right"
            formatter={(v: number) => `${v}%`}
            style={{ fill: 'hsl(215 20% 65%)', fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/TabCompletionChart.tsx
git commit -m "feat(dashboard): add TabCompletionChart (Recharts horizontal bar)"
```

---

## Task 5: AlertsTable

**Files:**
- Create: `components/dashboard/AlertsTable.tsx`

- [ ] **Step 1: Create `components/dashboard/AlertsTable.tsx`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/AlertsTable.tsx
git commit -m "feat(dashboard): add AlertsTable for low-score products"
```

---

## Task 6: Dashboard page

**Files:**
- Overwrite: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Overwrite `app/(app)/dashboard/page.tsx`**

```typescript
import { getDashboardData } from '@/lib/queries';
import { StatCard } from '@/components/dashboard/StatCard';
import { ScoreDistributionChart } from '@/components/dashboard/ScoreDistributionChart';
import { TabCompletionChart } from '@/components/dashboard/TabCompletionChart';
import { AlertsTable } from '@/components/dashboard/AlertsTable';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { stats, distribution, tabCompletion, alerts } = data;

  // Derive accent for avg score card
  const scoreAccent =
    stats.avgScore < 50 ? 'red' :
    stats.avgScore < 70 ? 'amber' :
    stats.avgScore < 90 ? 'blue' : 'green';

  return (
    <div className="px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: 'hsl(213 31% 91%)' }}
        >
          Дашборд
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
          Каталог AAPA Store · Uzum Marketplace
        </p>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Всего товаров"
          value={stats.total}
        />
        <StatCard
          label="Средний score"
          value={stats.avgScore}
          accent={scoreAccent}
        />
        <StatCard
          label="Score < 50"
          value={stats.lowScoreCount}
          accent={stats.lowScoreCount > 0 ? 'red' : 'default'}
          sublabel="требуют внимания"
        />
        <StatCard
          label="Продаётся"
          value={stats.onSaleCount}
          accent="green"
          sublabel="on_sale"
        />
        <StatCard
          label="Выручка каталога"
          value={stats.catalogRevenue > 0 ? `${stats.catalogRevenue.toLocaleString('ru-RU')} сум` : '—'}
          accent="green"
          sublabel="сумма прайсов"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
        >
          <h2 className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: 'hsl(215 20% 55%)' }}>
            Распределение score
          </h2>
          <ScoreDistributionChart distribution={distribution} />
        </div>
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
        >
          <h2 className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: 'hsl(215 20% 55%)' }}>
            Заполненность по вкладкам
          </h2>
          <TabCompletionChart tabCompletion={tabCompletion} />
        </div>
      </div>

      {/* Alerts table */}
      <div>
        <h2
          className="text-xs uppercase tracking-wider mb-3 font-medium"
          style={{ color: 'hsl(215 20% 55%)' }}
        >
          Товары с низким score (< 50)
        </h2>
        <AlertsTable alerts={alerts} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: all tests pass (including the new dashboard.test.ts from Task 1).

- [ ] **Step 4: Smoke test in browser**

Run: `npm run dev`, open http://localhost:3000/dashboard.
Expected:
- 5 stat cards visible: Всего товаров=7, Средний score (some number), Score<50 (count), Продаётся, Выручка
- Score Distribution bar chart with up to 4 colored bars
- Tab Completion horizontal bar chart with 5 rows
- Low-score alerts table (or green "All products score ≥ 50 ✓" if no low scores)
- Clicking an alert row navigates to `/products/<id>`

Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/dashboard/page.tsx
git commit -m "feat(dashboard): wire up dashboard page with stat cards + charts + alerts"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ `getDashboardData()` in `lib/queries.ts`, calls `getProductListRows()` internally — Task 1
- ✅ Stats: total, avgScore, lowScoreCount, onSaleCount, catalogRevenue — Task 1
- ✅ Distribution: red/yellow/blue/green bands — Task 1
- ✅ Tab completion: 5 tabs, metPct 0–100, sorted descending — Tasks 1 + 4
- ✅ Alerts: score < 50, sorted ascending — Task 1
- ✅ StatCard with accent colors — Task 2
- ✅ ScoreDistributionChart: 4 bars, correct colors, empty state — Task 3
- ✅ TabCompletionChart: horizontal, amber, sorted desc, empty state — Task 4
- ✅ AlertsTable: profile/sku/name/score/status/scheme cols, clickable rows, empty state — Task 5
- ✅ Dashboard page layout: 5 stat cards, 2 charts, alerts table — Task 6
- ✅ Edge case: no products → all zeros, empty states

**2. Placeholder scan:** No TBDs, no "handle edge cases", all code complete.

**3. Type consistency:**
- `DashboardData` defined Task 1, imported in Task 6 (via `getDashboardData` return)
- `ProductListRow` used in AlertsTable matches `lib/queries.ts` export
- `distribution` shape `{ red, yellow, blue, green }` consistent Tasks 1 → 3 → 6
- `tabCompletion` shape `{ tab: string; metPct: number }[]` consistent Tasks 1 → 4 → 6
