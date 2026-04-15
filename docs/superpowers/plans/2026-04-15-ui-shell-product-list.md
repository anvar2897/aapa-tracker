# AAPA Tracker — Phase 2a: App Shell + Product List

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the app shell (sidebar navigation, route layout) and a fully functional product list page that shows all 7 seeded products with live computed scores, profile badges, status badges, and FBO warnings.

**Architecture:** Next.js App Router route group `(app)` wraps all main pages with a sidebar layout. Data is fetched in server components using direct Drizzle calls; the product list passes data to a client component for client-side filter/sort. Score is computed on the server via `computeScore()` from `lib/scoring.ts`.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS, shadcn/ui, Lucide icons, Drizzle ORM + better-sqlite3

---

## Context for implementers

- Working directory: `/Users/anvar/Documents/GitHub/aapa-tracker`
- DB is already migrated and seeded (7 products: 5 accessories + 2 parts)
- `lib/scoring.ts` exports `computeScore(data: ProductDataForScoring): ScoreBreakdown`
- `db/index.ts` exports `db` (Drizzle instance) and `sqlite` (raw better-sqlite3)
- `db/schema.ts` exports all table definitions and inferred types
- `lib/constants.ts` exports `FBO_TURNOVER_WARN_DAYS = 45`, `FBO_TURNOVER_CRITICAL_DAYS = 55`
- Theme is dark industrial: `#0f0f1a` sidebar, `#1a1a2e` background, `#f59e0b` amber accent
- `app/globals.css` uses shadcn v4: `@import "shadcn/tailwind.css"` (NOT `@tailwind base/components/utilities` directly)
- CSS variables use `hsl(...)` format, e.g. `--background: hsl(222 47% 11%)`
- `tailwind.config.ts` has AAPA custom tokens: `base`, `base-card`, `accent`, `score-red/yellow/blue/green`, `profile-accessories`, `profile-parts`

---

## File Map

**Create:**
- `app/(app)/layout.tsx` — route group shell layout (sidebar + main)
- `app/(app)/products/page.tsx` — product list server component
- `app/(app)/dashboard/page.tsx` — placeholder
- `app/(app)/audit/page.tsx` — placeholder
- `app/(app)/import/page.tsx` — placeholder
- `components/common/Sidebar.tsx` — sidebar navigation (client component)
- `components/common/ScoreBadge.tsx` — SVG ring score indicator
- `components/common/ProfileBadge.tsx` — "A" or "P" badge
- `components/common/StatusBadge.tsx` — moderation status pill
- `components/common/FboAlert.tsx` — FBO turnover warning indicator
- `components/product/ProductTable.tsx` — client component (filter/sort state)
- `lib/queries.ts` — server-side data access functions

**Modify:**
- `app/page.tsx` — change default Next.js page to redirect to `/products`

---

## Task 1: Root redirect + route group shell layout

**Files:**
- Modify: `app/page.tsx`
- Create: `app/(app)/layout.tsx`

- [ ] **Step 1: Replace app/page.tsx with redirect**

```typescript
// app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/products');
}
```

- [ ] **Step 2: Create app/(app)/layout.tsx**

```typescript
// app/(app)/layout.tsx
import { Sidebar } from '@/components/common/Sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'hsl(222 47% 11%)' }}>
      <Sidebar />
      <main className="flex-1 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
```

Note: The Sidebar import will fail until Task 2 creates it. That's expected — TypeScript will error, but it resolves after Task 2.

- [ ] **Step 3: Create the components/common/ directory**

```bash
mkdir -p /Users/anvar/Documents/GitHub/aapa-tracker/components/common
mkdir -p /Users/anvar/Documents/GitHub/aapa-tracker/components/product
mkdir -p /Users/anvar/Documents/GitHub/aapa-tracker/app/\(app\)/products
mkdir -p /Users/anvar/Documents/GitHub/aapa-tracker/app/\(app\)/dashboard
mkdir -p /Users/anvar/Documents/GitHub/aapa-tracker/app/\(app\)/audit
mkdir -p /Users/anvar/Documents/GitHub/aapa-tracker/app/\(app\)/import
```

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/\(app\)/layout.tsx
git commit -m "feat(shell): add route group layout and root redirect"
```

---

## Task 2: Sidebar navigation

**Files:**
- Create: `components/common/Sidebar.tsx`

- [ ] **Step 1: Create components/common/Sidebar.tsx**

```typescript
// components/common/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, LayoutDashboard, ClipboardList, Upload } from 'lucide-react';

const navItems = [
  { href: '/products', icon: Package, label: 'Товары' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { href: '/audit', icon: ClipboardList, label: 'Аудит' },
  { href: '/import', icon: Upload, label: 'Импорт' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col w-56 shrink-0 min-h-screen border-r"
      style={{
        backgroundColor: 'hsl(222 47% 8%)',
        borderColor: 'hsl(216 34% 18%)',
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5 border-b"
        style={{ borderColor: 'hsl(216 34% 18%)' }}
      >
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold font-mono text-amber-400 tracking-tight">
            AAPA
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">
            tracker
          </span>
        </div>
        <p className="text-[10px] mt-0.5" style={{ color: 'hsl(215 20% 40%)' }}>
          Uzum Marketplace
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                active
                  ? 'text-amber-400'
                  : 'hover:text-gray-200'
              }`}
              style={
                active
                  ? {
                      backgroundColor: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.15)',
                    }
                  : {
                      color: 'hsl(215 20% 55%)',
                    }
              }
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.5} />
              <span className={active ? 'font-medium' : ''}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-4 border-t"
        style={{
          borderColor: 'hsl(216 34% 18%)',
          color: 'hsl(215 20% 35%)',
        }}
      >
        <p className="text-[10px] font-mono">v0.1.0 · SQLite</p>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verify dev server loads with sidebar**

```bash
cd /Users/anvar/Documents/GitHub/aapa-tracker
timeout 12 npm run dev 2>&1 | grep -E "Ready|Error|error" | head -5
```

Expected: `✓ Ready` with no errors.

- [ ] **Step 3: Commit**

```bash
git add components/common/Sidebar.tsx
git commit -m "feat(shell): add sidebar navigation with active state"
```

---

## Task 3: ScoreBadge component

**Files:**
- Create: `components/common/ScoreBadge.tsx`

- [ ] **Step 1: Create components/common/ScoreBadge.tsx**

```typescript
// components/common/ScoreBadge.tsx

type Props = {
  score: number;
  size?: number;
};

type ScoreColor = 'red' | 'yellow' | 'blue' | 'green';

const colorHex: Record<ScoreColor, string> = {
  red: '#ef4444',
  yellow: '#eab308',
  blue: '#3b82f6',
  green: '#22c55e',
};

function getColor(score: number): ScoreColor {
  if (score <= 49) return 'red';
  if (score <= 69) return 'yellow';
  if (score <= 89) return 'blue';
  return 'green';
}

export function ScoreBadge({ score, size = 44 }: Props) {
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const color = colorHex[getColor(score)];
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Score: ${score}`}
    >
      {/* Track ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring — starts at top (rotate -90deg via transform) */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
      {/* Score number */}
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={size * 0.28}
        fontFamily="var(--font-geist-mono), monospace"
        fontWeight="600"
      >
        {score}
      </text>
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/common/ScoreBadge.tsx
git commit -m "feat(ui): add ScoreBadge SVG ring component"
```

---

## Task 4: ProfileBadge, StatusBadge, FboAlert

**Files:**
- Create: `components/common/ProfileBadge.tsx`
- Create: `components/common/StatusBadge.tsx`
- Create: `components/common/FboAlert.tsx`

- [ ] **Step 1: Create components/common/ProfileBadge.tsx**

```typescript
// components/common/ProfileBadge.tsx

type Props = {
  profile: 'accessories' | 'parts';
};

export function ProfileBadge({ profile }: Props) {
  const isAccessories = profile === 'accessories';
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold font-mono shrink-0"
      style={
        isAccessories
          ? {
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }
          : {
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }
      }
      title={isAccessories ? 'Аксессуары' : 'Запчасти'}
    >
      {isAccessories ? 'A' : 'P'}
    </span>
  );
}
```

- [ ] **Step 2: Create components/common/StatusBadge.tsx**

```typescript
// components/common/StatusBadge.tsx

type Status = 'draft' | 'ready' | 'on_sale' | 'blocked' | 'archived';

type Props = {
  status: Status;
};

const config: Record<Status, { label: string; style: React.CSSProperties }> = {
  draft: {
    label: 'Черновик',
    style: { backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', border: '1px solid rgba(107, 114, 128, 0.25)' },
  },
  ready: {
    label: 'Готов',
    style: { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.25)' },
  },
  on_sale: {
    label: 'Продаётся',
    style: { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.25)' },
  },
  blocked: {
    label: 'Заблокирован',
    style: { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)' },
  },
  archived: {
    label: 'Архив',
    style: { backgroundColor: 'rgba(75, 85, 99, 0.15)', color: '#6b7280', border: '1px solid rgba(75, 85, 99, 0.2)' },
  },
};

export function StatusBadge({ status }: Props) {
  const { label, style } = config[status] ?? config.draft;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap"
      style={style}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 3: Create components/common/FboAlert.tsx**

```typescript
// components/common/FboAlert.tsx
// §5.3 Uzum: FBO free window = 60 days. Warn at 45, critical at 55.

import { FBO_TURNOVER_WARN_DAYS, FBO_TURNOVER_CRITICAL_DAYS } from '@/lib/constants';

type Props = {
  days: number | null;
  scheme: string;
};

export function FboAlert({ days, scheme }: Props) {
  // Only applies to FBO fulfillment
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
```

- [ ] **Step 4: Commit**

```bash
git add components/common/ProfileBadge.tsx components/common/StatusBadge.tsx components/common/FboAlert.tsx
git commit -m "feat(ui): add ProfileBadge, StatusBadge, FboAlert primitives"
```

---

## Task 5: lib/queries.ts — data access layer

**Files:**
- Create: `lib/queries.ts`

- [ ] **Step 1: Create lib/queries.ts**

```typescript
// lib/queries.ts
// Server-only: uses Drizzle ORM directly. Never import from client components.

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  products,
  productCards,
  productMedia,
  accessoriesData,
  partsData,
  pricing,
  fulfillment,
  moderation,
} from '@/db/schema';
import { computeScore } from '@/lib/scoring';
import type { ScoreBreakdown } from '@/lib/scoring';

export type ProductListRow = {
  id: number;
  sku: string;
  productProfile: 'accessories' | 'parts';
  nameRu: string;
  status: 'draft' | 'ready' | 'on_sale' | 'blocked' | 'archived';
  scheme: 'FBS' | 'FBO' | 'DBS' | 'EDBS';
  stockQuantity: number;
  fboTurnoverDays: number | null;
  sellingPrice: number | null;
  photoCount: number;
  score: ScoreBreakdown;
};

export async function getProductListRows(): Promise<ProductListRow[]> {
  const allProducts = await db.select().from(products);

  const rows = await Promise.all(
    allProducts.map(async (p) => {
      const [card] = await db
        .select()
        .from(productCards)
        .where(eq(productCards.productId, p.id));

      const media = await db
        .select()
        .from(productMedia)
        .where(eq(productMedia.productId, p.id));

      const [acc] = await db
        .select()
        .from(accessoriesData)
        .where(eq(accessoriesData.productId, p.id));

      const [parts] = await db
        .select()
        .from(partsData)
        .where(eq(partsData.productId, p.id));

      const [price] = await db
        .select()
        .from(pricing)
        .where(eq(pricing.productId, p.id));

      const [ful] = await db
        .select()
        .from(fulfillment)
        .where(eq(fulfillment.productId, p.id));

      const [mod] = await db
        .select()
        .from(moderation)
        .where(eq(moderation.productId, p.id));

      const score = computeScore({
        profile: p.productProfile,
        card: card ?? {},
        media: media ?? [],
        accessoriesData: acc ?? null,
        partsData: parts ?? null,
        pricing: price ?? null,
      });

      return {
        id: p.id,
        sku: p.sku,
        productProfile: p.productProfile,
        nameRu: p.nameRu,
        status: (mod?.status ?? 'draft') as ProductListRow['status'],
        scheme: (ful?.scheme ?? 'FBS') as ProductListRow['scheme'],
        stockQuantity: ful?.stockQuantity ?? 0,
        fboTurnoverDays: ful?.fboTurnoverDays ?? null,
        sellingPrice: price?.sellingPrice ?? null,
        photoCount: media.filter((m) => m.mediaType === 'photo').length,
        score,
      };
    })
  );

  return rows;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd /Users/anvar/Documents/GitHub/aapa-tracker
npx tsc --noEmit 2>&1 | grep "lib/queries"
```

Expected: no output (no errors in lib/queries.ts)

- [ ] **Step 3: Commit**

```bash
git add lib/queries.ts
git commit -m "feat(lib): add queries.ts — getProductListRows with score computation"
```

---

## Task 6: ProductTable client component

**Files:**
- Create: `components/product/ProductTable.tsx`

- [ ] **Step 1: Create components/product/ProductTable.tsx**

This is a `'use client'` component. It receives pre-fetched rows and owns filter/sort state.

```typescript
// components/product/ProductTable.tsx
'use client';

import { useState, useMemo } from 'react';
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
  const [profileFilter, setProfileFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<SortDir>('asc'); // asc = worst first (attention needed)

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
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(215 20% 55%)', width: 48 }}>
                {/* Profile */}
              </th>
              <th
                className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                style={{ color: 'hsl(215 20% 55%)' }}
                onClick={() => toggleSort('sku')}
              >
                <span className="flex items-center gap-1.5">
                  SKU <SortIcon k="sku" />
                </span>
              </th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(215 20% 55%)' }}>
                Название
              </th>
              <th
                className="px-4 py-3 text-center font-medium cursor-pointer select-none"
                style={{ color: 'hsl(215 20% 55%)', width: 80 }}
                onClick={() => toggleSort('score')}
              >
                <span className="flex items-center justify-center gap-1.5">
                  Score <SortIcon k="score" />
                </span>
              </th>
              <th
                className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                style={{ color: 'hsl(215 20% 55%)' }}
                onClick={() => toggleSort('status')}
              >
                <span className="flex items-center gap-1.5">
                  Статус <SortIcon k="status" />
                </span>
              </th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(215 20% 55%)', width: 80 }}>
                Схема
              </th>
              <th
                className="px-4 py-3 text-right font-medium cursor-pointer select-none"
                style={{ color: 'hsl(215 20% 55%)', width: 80 }}
                onClick={() => toggleSort('stock')}
              >
                <span className="flex items-center justify-end gap-1.5">
                  Остаток <SortIcon k="stock" />
                </span>
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
                className="transition-colors"
                style={{
                  backgroundColor:
                    idx % 2 === 0 ? 'hsl(222 47% 12%)' : 'hsl(222 47% 11%)',
                  borderBottom: '1px solid hsl(216 34% 19%)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                    'hsl(222 47% 16%)';
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
                  <span
                    className="font-mono text-xs"
                    style={{ color: 'hsl(215 20% 65%)' }}
                  >
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
                  <span
                    className="font-mono text-xs"
                    style={{ color: 'hsl(215 20% 65%)' }}
                  >
                    {row.scheme}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className="font-mono text-sm"
                    style={{ color: 'hsl(213 31% 88%)' }}
                  >
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
```

- [ ] **Step 2: Commit**

```bash
git add components/product/ProductTable.tsx
git commit -m "feat(ui): add ProductTable with filter/sort client component"
```

---

## Task 7: Product list page + placeholder pages

**Files:**
- Create: `app/(app)/products/page.tsx`
- Create: `app/(app)/dashboard/page.tsx`
- Create: `app/(app)/audit/page.tsx`
- Create: `app/(app)/import/page.tsx`

- [ ] **Step 1: Create app/(app)/products/page.tsx**

```typescript
// app/(app)/products/page.tsx
import { getProductListRows } from '@/lib/queries';
import { ProductTable } from '@/components/product/ProductTable';

export const dynamic = 'force-dynamic'; // always fresh from DB

export default async function ProductsPage() {
  const rows = await getProductListRows();

  // Summary counts for header stats
  const total = rows.length;
  const lowScore = rows.filter((r) => r.score.total < 50).length;
  const fboWarn = rows.filter(
    (r) => r.scheme === 'FBO' && r.fboTurnoverDays !== null && r.fboTurnoverDays >= 45
  ).length;

  return (
    <div className="px-8 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: 'hsl(213 31% 91%)' }}
          >
            Товары
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
            Каталог AAPA Store · Uzum Marketplace
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm"
            style={{
              backgroundColor: 'hsl(222 47% 15%)',
              border: '1px solid hsl(216 34% 22%)',
              color: 'hsl(213 31% 88%)',
            }}
          >
            <span style={{ color: 'hsl(215 20% 55%)' }}>Всего:</span>
            <span className="font-mono font-semibold">{total}</span>
          </div>
          {lowScore > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
              }}
            >
              <span>Score &lt;50:</span>
              <span className="font-mono font-semibold">{lowScore}</span>
            </div>
          )}
          {fboWarn > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm"
              style={{
                backgroundColor: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.2)',
                color: '#fbbf24',
              }}
            >
              <span>⚠ FBO:</span>
              <span className="font-mono font-semibold">{fboWarn}</span>
            </div>
          )}
        </div>
      </div>

      {/* Product table */}
      <ProductTable rows={rows} />
    </div>
  );
}
```

- [ ] **Step 2: Create app/(app)/dashboard/page.tsx**

```typescript
// app/(app)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="px-8 py-8">
      <h1
        className="text-2xl font-semibold tracking-tight"
        style={{ color: 'hsl(213 31% 91%)' }}
      >
        Дашборд
      </h1>
      <p className="text-sm mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
        Phase 3 — аналитика и графики
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create app/(app)/audit/page.tsx**

```typescript
// app/(app)/audit/page.tsx
export default function AuditPage() {
  return (
    <div className="px-8 py-8">
      <h1
        className="text-2xl font-semibold tracking-tight"
        style={{ color: 'hsl(213 31% 91%)' }}
      >
        Аудит каталога
      </h1>
      <p className="text-sm mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
        Phase 4 — сводный отчёт по каталогу
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Create app/(app)/import/page.tsx**

```typescript
// app/(app)/import/page.tsx
export default function ImportPage() {
  return (
    <div className="px-8 py-8">
      <h1
        className="text-2xl font-semibold tracking-tight"
        style={{ color: 'hsl(213 31% 91%)' }}
      >
        Импорт / Экспорт
      </h1>
      <p className="text-sm mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
        Phase 4 — CSV импорт/экспорт
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Verify TypeScript and dev server**

```bash
cd /Users/anvar/Documents/GitHub/aapa-tracker
npx tsc --noEmit 2>&1 | grep -v node_modules | grep -v ".next"
```

Expected: no errors.

```bash
timeout 15 npm run dev 2>&1 | grep -E "Ready|error|Error" | head -5
```

Expected: `✓ Ready`

- [ ] **Step 6: Manually verify the page renders correctly**

Open `http://localhost:3000` — should redirect to `http://localhost:3000/products`.

The products page should show:
- Dark sidebar with AAPA logo and 4 nav items
- "Товары" header with count pills
- Table with 7 rows (5 accessories + 2 parts)
- Score rings in 4 colors (red/yellow/blue/green)
- "A" amber badges for accessories, "P" blue for parts
- FBO warning (⚠) visible for Dash cam (48 days)
- Filter dropdowns work (try "Запчасти" filter → 2 rows)
- Sorting works (click Score column header → worst first/best first)

- [ ] **Step 7: Commit**

```bash
git add app/\(app\)/products/page.tsx app/\(app\)/dashboard/page.tsx app/\(app\)/audit/page.tsx app/\(app\)/import/page.tsx
git commit -m "feat(pages): add product list page + placeholder pages"
```

---

## Self-Review

**Spec coverage:**
- [x] App shell with sidebar nav — Tasks 1-2
- [x] Sidebar nav items: Products, Dashboard, Audit, Import — Task 2
- [x] ScoreBadge (colored ring, 0-100, 4 colors) — Task 3
- [x] ProfileBadge (A/P) — Task 4
- [x] StatusBadge (5 states) — Task 4
- [x] FBO turnover warning at 45 days, critical at 55 — Task 4 (uses constants)
- [x] Product list with filters (profile, status) — Tasks 5-7
- [x] Sort by score (default: ascending = worst first) — Task 6
- [x] Server-side score computation via computeScore() — Task 5
- [x] Root redirect to /products — Task 1
- [x] Placeholder pages for dashboard, audit, import — Task 7

**Placeholder scan:** No TBDs or vague steps.

**Type consistency:**
- `ProductListRow` defined in `lib/queries.ts` and imported in both `ProductTable.tsx` and `products/page.tsx`
- `FboAlert` receives `scheme: string` (matches `ProductListRow.scheme: 'FBS' | 'FBO' | 'DBS' | 'EDBS'`)
- `StatusBadge` receives `status: Status` (matches `ProductListRow.status`)
- `ProfileBadge` receives `profile: 'accessories' | 'parts'` (matches `ProductListRow.productProfile`)
