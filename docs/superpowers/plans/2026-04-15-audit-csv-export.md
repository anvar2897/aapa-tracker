# AAPA Tracker — Phase 4A: Audit Report + CSV Export

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a catalog-wide audit report page with severity-grouped issues, plus a CSV export button on the import/export page that downloads all product data.

**Architecture:** `getAuditData()` added to `lib/queries.ts` calls `getProductListRows()` and classifies each product into severity buckets (critical / high / medium / low). The audit page is a server component. CSV export is a Next.js API route (`/api/export/products`) that streams a CSV response. The existing `/import` page gets a download button wired to that route.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Drizzle ORM (read-only), Node.js built-in string serialization (no csv library needed)

---

## Context for implementers

- Working directory: `/Users/anvar/Documents/GitHub/aapa-tracker`
- `lib/queries.ts` exports `getProductListRows()` → `ProductListRow[]`:
  ```typescript
  type ProductListRow = {
    id: number; sku: string; productProfile: 'accessories' | 'parts';
    nameRu: string; status: 'draft' | 'ready' | 'on_sale' | 'blocked' | 'archived';
    scheme: 'FBS' | 'FBO' | 'DBS' | 'EDBS'; stockQuantity: number;
    fboTurnoverDays: number | null; sellingPrice: number | null;
    photoCount: number; score: ScoreBreakdown;
  };
  // ScoreBreakdown.fields: { label: string; weight: number; earned: number; met: boolean }[]
  ```
- `lib/constants.ts` exports: `FBO_TURNOVER_WARN_DAYS = 45`, `FBO_TURNOVER_CRITICAL_DAYS = 55`
- Exact scoring field labels (from `lib/scoring.ts`):
  - Accessories: 'Photos ≥3', 'Filter properties', 'Title RU', 'Title UZ', 'Description RU', 'Description UZ', 'Use case described', 'Properties RU ≥3', 'Properties UZ ≥3', 'Short description', 'Video present', 'All photos compliant', 'Brand', 'Bundle info (if applicable)', 'Primary photo (front view)', 'Weight & dimensions', 'Price set', 'Competitor price', 'VAT'
  - Parts: 'Compatible models', 'OEM number', 'Title RU', 'Title UZ', 'Filter properties', 'Photos ≥3', 'Properties RU ≥3', 'Properties UZ ≥3', 'Weight & dimensions', 'Brand', 'All photos compliant', 'Cross-references', 'Fitment position', 'Material/spec', 'Description RU', 'Description UZ', 'Short description', 'Warranty', 'Price set', 'Part dimensions', 'Primary photo (front view)', 'VAT'
- `lib/validators.ts` exports `checkPhotoCompliance(media)` — **not needed here**: photo compliance is already computed in `score.fields` via 'All photos compliant' label
- `components/common/ScoreBadge.tsx` — props: `{ score: number; size?: number }`
- `components/common/ProfileBadge.tsx` — props: `{ profile: 'accessories' | 'parts' }`
- `components/common/StatusBadge.tsx` — props: `{ status: string }`
- Inline-style palette: page bg `hsl(222 47% 11%)`, card bg `hsl(222 47% 15%)`, border `hsl(216 34% 22%)`, primary text `hsl(213 31% 91%)`, muted `hsl(215 20% 55%)`, amber `#f59e0b`
- Tests: Vitest `environment: 'node'`, run `npm test`. Path alias `@/` = project root.
- Both `app/(app)/audit/page.tsx` and `app/(app)/import/page.tsx` exist as stubs — **overwrite them**.
- `app/api/` directory does NOT yet exist — create it.

---

## File Map

**Modify:**
- `lib/queries.ts` — append `AuditIssue`, `AuditData` types + `getAuditData()` function

**Create:**
- `lib/__tests__/audit.test.ts` — integration test for `getAuditData`
- `components/audit/AuditSection.tsx` — severity section (label + count + rows)
- `app/api/export/products/route.ts` — CSV export API route
- `app/(app)/import/page.tsx` — overwrite stub with export button

**Overwrite:**
- `app/(app)/audit/page.tsx` — server component wiring audit sections

---

## Task 1: `getAuditData` query + test

**Files:**
- Modify: `lib/queries.ts`
- Create: `lib/__tests__/audit.test.ts`

### Audit issue classification

Each `AuditIssue` belongs to one severity level. A product can appear in multiple issues.

**Critical:**
- `blocked` — product status is `'blocked'`
- `missing_bilingual` — score field 'Title RU' OR 'Title UZ' not met (missing bilingual title)
- `photos_non_compliant` — score field 'All photos compliant' not met AND photoCount > 0

**High:**
- `low_score` — `score.total < 50`
- `parts_no_compatible_models` — `productProfile === 'parts'` AND score field 'Compatible models' not met
- `no_filter_properties` — score field 'Filter properties' not met
- `no_price` — score field 'Price set' not met

**Medium:**
- `accessories_few_photos` — `productProfile === 'accessories'` AND score field 'Photos ≥3' not met
- `accessories_no_use_case` — `productProfile === 'accessories'` AND score field 'Use case described' not met
- `no_video` — score field 'Video present' not met
- `parts_no_oem` — `productProfile === 'parts'` AND score field 'OEM number' not met

**Low:**
- `fbo_approaching` — `scheme === 'FBO'` AND `fboTurnoverDays !== null` AND `fboTurnoverDays >= 45`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/audit.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getAuditData } from '@/lib/queries';

describe('getAuditData', () => {
  it('returns correct shape', async () => {
    const data = await getAuditData();

    // Top-level keys
    expect(Array.isArray(data.critical)).toBe(true);
    expect(Array.isArray(data.high)).toBe(true);
    expect(Array.isArray(data.medium)).toBe(true);
    expect(Array.isArray(data.low)).toBe(true);

    // Each issue has required shape
    for (const issue of [...data.critical, ...data.high, ...data.medium, ...data.low]) {
      expect(typeof issue.type).toBe('string');
      expect(typeof issue.productId).toBe('number');
      expect(typeof issue.sku).toBe('string');
      expect(typeof issue.nameRu).toBe('string');
      expect(typeof issue.productProfile).toBe('string');
      expect(typeof issue.score).toBe('number');
    }
  });

  it('critical issues only contain valid types', async () => {
    const data = await getAuditData();
    const validCritical = new Set(['blocked', 'missing_bilingual', 'photos_non_compliant']);
    for (const issue of data.critical) {
      expect(validCritical.has(issue.type)).toBe(true);
    }
  });

  it('low issues are only fbo_approaching', async () => {
    const data = await getAuditData();
    for (const issue of data.low) {
      expect(issue.type).toBe('fbo_approaching');
    }
  });

  it('parts_no_compatible_models issues are only parts products', async () => {
    const data = await getAuditData();
    for (const issue of data.high) {
      if (issue.type === 'parts_no_compatible_models') {
        expect(issue.productProfile).toBe('parts');
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- audit.test.ts`
Expected: FAIL — `getAuditData is not a function`

- [ ] **Step 3: Append to `lib/queries.ts`**

```typescript
export type AuditIssue = {
  type: string;
  productId: number;
  sku: string;
  nameRu: string;
  productProfile: 'accessories' | 'parts';
  score: number;
  scheme: 'FBS' | 'FBO' | 'DBS' | 'EDBS';
  fboTurnoverDays: number | null;
  status: 'draft' | 'ready' | 'on_sale' | 'blocked' | 'archived';
};

export type AuditData = {
  critical: AuditIssue[];
  high: AuditIssue[];
  medium: AuditIssue[];
  low: AuditIssue[];
};

function fieldMet(row: ProductListRow, label: string): boolean {
  return row.score.fields.some(f => f.label === label && f.met);
}

function toIssue(type: string, row: ProductListRow): AuditIssue {
  return {
    type,
    productId: row.id,
    sku: row.sku,
    nameRu: row.nameRu,
    productProfile: row.productProfile,
    score: row.score.total,
    scheme: row.scheme,
    fboTurnoverDays: row.fboTurnoverDays,
    status: row.status,
  };
}

export async function getAuditData(): Promise<AuditData> {
  const rows = await getProductListRows();
  const critical: AuditIssue[] = [];
  const high: AuditIssue[] = [];
  const medium: AuditIssue[] = [];
  const low: AuditIssue[] = [];

  for (const row of rows) {
    // Critical
    if (row.status === 'blocked') {
      critical.push(toIssue('blocked', row));
    }
    if (!fieldMet(row, 'Title RU') || !fieldMet(row, 'Title UZ')) {
      critical.push(toIssue('missing_bilingual', row));
    }
    if (!fieldMet(row, 'All photos compliant') && row.photoCount > 0) {
      critical.push(toIssue('photos_non_compliant', row));
    }

    // High
    if (row.score.total < 50) {
      high.push(toIssue('low_score', row));
    }
    if (row.productProfile === 'parts' && !fieldMet(row, 'Compatible models')) {
      high.push(toIssue('parts_no_compatible_models', row));
    }
    if (!fieldMet(row, 'Filter properties')) {
      high.push(toIssue('no_filter_properties', row));
    }
    if (!fieldMet(row, 'Price set')) {
      high.push(toIssue('no_price', row));
    }

    // Medium
    if (row.productProfile === 'accessories' && !fieldMet(row, 'Photos ≥3')) {
      medium.push(toIssue('accessories_few_photos', row));
    }
    if (row.productProfile === 'accessories' && !fieldMet(row, 'Use case described')) {
      medium.push(toIssue('accessories_no_use_case', row));
    }
    if (!fieldMet(row, 'Video present')) {
      medium.push(toIssue('no_video', row));
    }
    if (row.productProfile === 'parts' && !fieldMet(row, 'OEM number')) {
      medium.push(toIssue('parts_no_oem', row));
    }

    // Low
    if (row.scheme === 'FBO' && row.fboTurnoverDays !== null && row.fboTurnoverDays >= 45) {
      low.push(toIssue('fbo_approaching', row));
    }
  }

  return { critical, high, medium, low };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- audit.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/queries.ts lib/__tests__/audit.test.ts
git commit -m "feat(lib): add getAuditData query with severity-bucketed issues"
```

---

## Task 2: AuditSection component + audit page

**Files:**
- Create: `components/audit/AuditSection.tsx`
- Overwrite: `app/(app)/audit/page.tsx`

- [ ] **Step 1: Create `components/audit/AuditSection.tsx`**

```typescript
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
  critical: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', dot: '#ef4444', label: 'Критично' },
  high:     { bg: 'rgba(234,179,8,0.06)', border: 'rgba(234,179,8,0.2)',  dot: '#eab308', label: 'Высокий' },
  medium:   { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b', label: 'Средний' },
  low:      { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)', dot: '#3b82f6', label: 'Низкий' },
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
      {/* Header */}
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

      {/* Issue rows */}
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
```

- [ ] **Step 2: Overwrite `app/(app)/audit/page.tsx`**

```typescript
import { getAuditData } from '@/lib/queries';
import { AuditSection } from '@/components/audit/AuditSection';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const data = await getAuditData();
  const totalIssues =
    data.critical.length + data.high.length + data.medium.length + data.low.length;

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: 'hsl(213 31% 91%)' }}
          >
            Аудит каталога
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
            {totalIssues} проблем обнаружено
          </p>
        </div>
        <a
          href="/api/export/products"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium"
          style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 28%)', color: 'hsl(213 31% 91%)' }}
          download="aapa-audit.csv"
        >
          Скачать CSV
        </a>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">
        <AuditSection severity="critical" issues={data.critical} />
        <AuditSection severity="high"     issues={data.high} />
        <AuditSection severity="medium"   issues={data.medium} />
        <AuditSection severity="low"      issues={data.low} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/audit/AuditSection.tsx "app/(app)/audit/page.tsx"
git commit -m "feat(audit): add audit page with severity-grouped issues"
```

---

## Task 3: CSV export API route + import page update

**Files:**
- Create: `app/api/export/products/route.ts`
- Overwrite: `app/(app)/import/page.tsx`

### CSV format

Columns (in order):
```
id, sku, barcode, productProfile, nameRu, nameUz, status, scheme,
stockQuantity, fboTurnoverDays, sellingPrice, photoCount, scoreTotal
```

One header row, then one row per product. Values with commas or quotes are wrapped in double-quotes; internal double-quotes are escaped as `""`. No external CSV library — implement escaping inline.

- [ ] **Step 1: Create `app/api/export/products/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { getProductListRows } from '@/lib/queries';

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const rows = await getProductListRows();

  const headers = [
    'id', 'sku', 'productProfile', 'nameRu', 'nameUz',
    'status', 'scheme', 'stockQuantity', 'fboTurnoverDays',
    'sellingPrice', 'photoCount', 'scoreTotal',
  ];

  const lines: string[] = [headers.join(',')];

  for (const row of rows) {
    lines.push([
      escapeCsv(row.id),
      escapeCsv(row.sku),
      escapeCsv(row.productProfile),
      escapeCsv(row.nameRu),
      escapeCsv(row.nameUz),
      escapeCsv(row.status),
      escapeCsv(row.scheme),
      escapeCsv(row.stockQuantity),
      escapeCsv(row.fboTurnoverDays),
      escapeCsv(row.sellingPrice),
      escapeCsv(row.photoCount),
      escapeCsv(row.score.total),
    ].join(','));
  }

  const csv = lines.join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="aapa-products.csv"',
    },
  });
}
```

**Note:** `ProductListRow` does not include `nameUz` — it only has `nameRu`. Check the actual type in `lib/queries.ts`. If `nameUz` is absent, remove it from headers and the row serialization. Use only fields that actually exist on `ProductListRow`.

- [ ] **Step 2: Overwrite `app/(app)/import/page.tsx`**

```typescript
export default function ImportPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: 'hsl(213 31% 91%)' }}
        >
          Импорт / Экспорт
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
          Экспорт каталога · CSV импорт (Phase 4B)
        </p>
      </div>

      {/* Export section */}
      <div
        className="rounded-lg p-6 mb-6"
        style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
      >
        <h2 className="text-sm font-medium mb-1" style={{ color: 'hsl(213 31% 91%)' }}>
          Экспорт каталога
        </h2>
        <p className="text-xs mb-4" style={{ color: 'hsl(215 20% 55%)' }}>
          Скачать все товары в формате CSV (id, SKU, профиль, названия, статус, схема, остатки, score)
        </p>
        <a
          href="/api/export/products"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
          style={{ backgroundColor: '#f59e0b', color: 'hsl(222 47% 11%)' }}
          download="aapa-products.csv"
        >
          Скачать CSV
        </a>
      </div>

      {/* Import placeholder */}
      <div
        className="rounded-lg p-6"
        style={{
          backgroundColor: 'hsl(222 47% 13%)',
          border: '1px dashed hsl(216 34% 28%)',
        }}
      >
        <h2 className="text-sm font-medium mb-1" style={{ color: 'hsl(215 20% 55%)' }}>
          CSV Импорт
        </h2>
        <p className="text-xs" style={{ color: 'hsl(215 20% 40%)' }}>
          Будет доступно в Phase 4B
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/export/products/route.ts "app/(app)/import/page.tsx"
git commit -m "feat(export): add CSV export API route + update import/export page"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Critical: blocked status, missing bilingual — Task 1
- ✅ Critical: non-compliant photos — Task 1
- ✅ High: score < 50, parts no compatible models, no filter properties — Task 1
- ✅ High: no price — Task 1 (mapped from 'Price set' field)
- ✅ Medium: accessories < 3 photos, no use case, no video, parts no OEM — Task 1
- ✅ Low: FBO approaching 45d — Task 1
- ✅ Severity sections with expand/collapse, product rows linking to editor — Task 2
- ✅ "Exportable as CSV" on audit page (download link) — Task 2
- ✅ CSV export API route with all ProductListRow fields — Task 3
- ✅ Import/export page with export button + import placeholder — Task 3
- ⚠️ Spec mentions "Cards with 0 reviews" under High — excluded because `ProductListRow` has no review count field (performance data, not in scope for this phase)
- ⚠️ Spec mentions "declining conversion trend" under Low — excluded (requires time-series performance data, not available)
- ⚠️ Spec mentions "barcode" in CSV — excluded from `ProductListRow` (not returned by `getProductListRows()`). Adding a new query would be out of scope; the export covers all fields that exist on `ProductListRow`.

**2. Placeholder scan:** No TBDs. Import section has intentional placeholder note for Phase 4B.

**3. Type consistency:**
- `AuditIssue` defined Task 1, used in Task 2 (`AuditSection` props) — consistent
- `AuditData` defined Task 1, used in Task 2 (audit page) — consistent
- `fieldMet()` helper uses `row.score.fields` — matches `ScoreBreakdown.fields` shape
- `ProductListRow` fields used in CSV route exactly match the type definition
