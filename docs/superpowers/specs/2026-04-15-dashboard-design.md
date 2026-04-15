# Dashboard — Design Spec

**Date:** 2026-04-15  
**Phase:** 3  
**Audience:** Owner + manager — operational overview, readable at a glance

---

## Goal

Single-page dashboard showing catalog health, score distribution, tab completion gaps, and low-score alerts. Primary signal: which products score <50 and are blocking conversions.

---

## Data Layer

### `getDashboardData()` — new function in `lib/queries.ts`

Calls `getProductListRows()` internally. No extra DB queries. Computes all stats in one pass over the returned rows.

**Return type:**

```typescript
export type DashboardData = {
  stats: {
    total: number;
    avgScore: number;
    lowScoreCount: number;    // score < 50
    onSaleCount: number;      // moderation.status === 'on_sale'
    catalogRevenue: number;   // sum of sellingPrice for products that have pricing rows
  };
  distribution: {
    red: number;    // score < 50
    yellow: number; // 50–69
    blue: number;   // 70–89
    green: number;  // 90–100
  };
  tabCompletion: {
    tab: string;
    metPct: number; // 0–100, avg % of fields met for that tab across all products
  }[];
  alerts: ProductListRow[]; // score < 50, sorted ascending by score
};
```

**Tab completion grouping** — fields from `ScoreBreakdown.fields` grouped by label prefix:

| Tab label | Field labels matched |
|-----------|---------------------|
| Карточка | Title RU, Title UZ, Description RU, Description UZ, Short desc, Brand, VAT, Weight/dims |
| Медиа | Photos ≥3, Video present, All photos compliant, Primary photo front view |
| Свойства | Filter properties, Properties RU, Properties UZ |
| Профиль | Use case, OEM number, Compatible models, Cross-references, Fitment position, Material/spec, Bundle info |
| Цены | Price, Competitor price |

For each group: `metPct = (count of fields met across all products) / (total possible fields across all products) * 100`.

**Edge cases:**
- No products → all stats 0, distribution all 0, `tabCompletion` empty, `alerts` empty
- Product with no pricing row → excluded from `catalogRevenue`
- Product with no card row → all fields `met: false` (penalizes correctly)

---

## Components

```
app/(app)/dashboard/page.tsx              server component — fetches DashboardData, passes as props
components/dashboard/
  StatCard.tsx                            reusable: label, value, sublabel, optional color accent
  ScoreDistributionChart.tsx              Recharts BarChart — 4 bars (red/yellow/blue/green)
  TabCompletionChart.tsx                  Recharts horizontal BarChart — % met per tab
  AlertsTable.tsx                         low-score products table, rows link to /products/[id]
```

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [ Total ] [ Avg Score ] [ <50 ] [ On Sale ] [ Revenue ]    │  ← 5 stat cards
├────────────────────────────┬────────────────────────────────┤
│  Score Distribution        │  Tab Completion                 │  ← charts 50/50
│  (bar: red/yellow/blue/    │  (horizontal bar: % met         │
│   green count)             │   per tab, sorted desc)         │
├────────────────────────────┴────────────────────────────────┤
│  Low-Score Alerts (score < 50, sorted ascending)            │  ← full width table
│  Columns: Profile | SKU | Name | Score | Status | Scheme   │
│  Empty state: "All products score ≥ 50 ✓"                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Details

### StatCard
Props: `label: string`, `value: string | number`, `sublabel?: string`, `accent?: 'red' | 'amber' | 'green' | 'blue' | 'default'`

Accent colors:
- `<50 count` → red if >0, default if 0
- `Avg score` → uses score color band
- `Revenue` → green
- Others → default

### ScoreDistributionChart
- Recharts `BarChart` with 4 bars
- Colors: red `#ef4444`, yellow `#eab308`, blue `#3b82f6`, green `#22c55e`
- X-axis labels: `<50`, `50–69`, `70–89`, `90–100`
- Y-axis: product count
- Empty state: centered text "No products yet"
- `'use client'`

### TabCompletionChart
- Recharts horizontal `BarChart`
- X-axis: 0–100 (%)
- Y-axis: tab names
- Single bar per tab, color `#f59e0b` (amber)
- Sorted descending by metPct (best tabs at top)
- Empty state: centered text "No data yet"
- `'use client'`

### AlertsTable
- Columns: ProfileBadge | SKU (mono) | Name | ScoreBadge | StatusBadge | Scheme
- Rows clickable → `router.push('/products/${id}')`
- `cursor-pointer` + hover highlight (same style as ProductTable)
- Empty state: `"All products score ≥ 50 ✓"` in green
- `'use client'`

---

## Styling

Matches existing dashboard aesthetic:
- Page bg: `hsl(222 47% 11%)`
- Card bg: `hsl(222 47% 15%)`, border `hsl(216 34% 22%)`
- Primary text: `hsl(213 31% 91%)`
- Muted: `hsl(215 20% 55%)`
- Inline styles (no Tailwind for colors), Tailwind for layout/spacing

---

## What's NOT included

- Time-series charts (no performance data in seed)
- Per-product drill-down from charts (clicking a bar doesn't filter — use the product list page)
- Refresh button / auto-refresh (page is server-rendered, manual reload sufficient)
- Pagination on alerts table (if >50 low-score products, show all — unlikely in this catalog size)
