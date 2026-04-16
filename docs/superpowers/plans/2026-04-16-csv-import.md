# AAPA Tracker — Phase 4B: CSV Import

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bulk-create products from a CSV upload — parse the file, validate rows, create valid products, return per-row results. Includes downloadable template CSVs and an upload UI on the import page.

**Architecture:** A pure parser utility (`lib/csvParser.ts`) handles CSV text → typed rows with validation. A `POST /api/import/products` route accepts multipart form data, runs the parser, calls `createProduct` for each valid row, and returns a JSON summary. A client `ImportForm` component on the import page handles file selection, submission, and result display. Templates are static files in `/public/templates/`.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Web `FormData` API, no external CSV library

---

## Context for implementers

- Working directory: `/Users/anvar/Documents/GitHub/aapa-tracker`
- `app/actions/products.ts` exports `createProduct(data)` — used in the API route (not as a server action, but called directly since the route is server-side). Actually: import the DB + insert logic directly in the route, or re-use `createProduct`. Note: `createProduct` has `'use server'` directive — in an API route you can import and call it directly since API routes are server-side.
- `products` table columns relevant to import: `sku` (required, unique), `barcode` (optional), `productProfile` ('accessories'|'parts', required), `nameRu` (required), `nameUz` (required)
- `createProduct` signature:
  ```typescript
  createProduct(data: {
    sku: string; barcode?: string;
    productProfile: 'accessories' | 'parts';
    nameRu: string; nameUz: string;
  }): Promise<{ id: number } | { error: string }>
  ```
- CSV import columns (same order in template and parser): `sku`, `barcode`, `productProfile`, `nameRu`, `nameUz`
- Validation rules per row:
  - `sku`: required, non-empty after trim
  - `productProfile`: must be exactly `'accessories'` or `'parts'`
  - `nameRu`: required, non-empty after trim
  - `nameUz`: required, non-empty after trim
  - `barcode`: optional, skip if empty
- Tests: Vitest `environment: 'node'`, run `npm test`. Path alias `@/` = project root.
- `app/(app)/import/page.tsx` — already has export section + import placeholder. **Replace only the placeholder** with the real `ImportForm`.
- Inline-style palette: page bg `hsl(222 47% 11%)`, card bg `hsl(222 47% 15%)`, border `hsl(216 34% 22%)`, primary text `hsl(213 31% 91%)`, muted `hsl(215 20% 55%)`, amber `#f59e0b`

---

## File Map

**Create:**
- `lib/csvParser.ts` — pure function: CSV text → `{ valid: ParsedRow[]; errors: RowError[] }`
- `lib/__tests__/csvParser.test.ts` — unit tests for parser
- `public/templates/aapa-accessories-template.csv` — static template file
- `public/templates/aapa-parts-template.csv` — static template file
- `app/api/import/products/route.ts` — POST handler
- `components/import/ImportForm.tsx` — client component

**Modify:**
- `app/(app)/import/page.tsx` — replace placeholder with `<ImportForm />`

---

## Task 1: CSV parser utility + tests

**Files:**
- Create: `lib/csvParser.ts`
- Create: `lib/__tests__/csvParser.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/csvParser.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseCsvImport } from '@/lib/csvParser';

const HEADER = 'sku,barcode,productProfile,nameRu,nameUz';

describe('parseCsvImport', () => {
  it('parses a valid accessories row', () => {
    const csv = `${HEADER}\nACC-TEST,,accessories,Тест RU,Test UZ`;
    const result = parseCsvImport(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0]).toEqual({
      sku: 'ACC-TEST',
      barcode: undefined,
      productProfile: 'accessories',
      nameRu: 'Тест RU',
      nameUz: 'Test UZ',
    });
  });

  it('parses a valid parts row with barcode', () => {
    const csv = `${HEADER}\nPRT-TEST,1234567890,parts,Деталь RU,Detal UZ`;
    const result = parseCsvImport(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.valid[0].barcode).toBe('1234567890');
    expect(result.valid[0].productProfile).toBe('parts');
  });

  it('reports error for missing sku', () => {
    const csv = `${HEADER}\n,,accessories,Тест RU,Test UZ`;
    const result = parseCsvImport(csv);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(2);
    expect(result.errors[0].message).toMatch(/sku/i);
  });

  it('reports error for invalid productProfile', () => {
    const csv = `${HEADER}\nTEST-1,,gadgets,Тест RU,Test UZ`;
    const result = parseCsvImport(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/productProfile/i);
  });

  it('reports error for missing nameRu', () => {
    const csv = `${HEADER}\nTEST-1,,accessories,,Test UZ`;
    const result = parseCsvImport(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/nameRu/i);
  });

  it('reports error for missing nameUz', () => {
    const csv = `${HEADER}\nTEST-1,,accessories,Тест RU,`;
    const result = parseCsvImport(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/nameUz/i);
  });

  it('skips blank lines', () => {
    const csv = `${HEADER}\nACC-1,,accessories,A RU,A UZ\n\nACC-2,,accessories,B RU,B UZ`;
    const result = parseCsvImport(csv);
    expect(result.valid).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it('returns empty when only header present', () => {
    const result = parseCsvImport(HEADER);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('handles quoted values with commas', () => {
    const csv = `${HEADER}\nACC-1,,"accessories","Тест, с запятой",Test UZ`;
    const result = parseCsvImport(csv);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].nameRu).toBe('Тест, с запятой');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- csvParser.test.ts`
Expected: FAIL — `parseCsvImport is not a function`

- [ ] **Step 3: Create `lib/csvParser.ts`**

```typescript
export type ParsedRow = {
  sku: string;
  barcode: string | undefined;
  productProfile: 'accessories' | 'parts';
  nameRu: string;
  nameUz: string;
};

export type RowError = {
  row: number; // 1-based, header = row 1, first data row = row 2
  message: string;
};

export type ParseResult = {
  valid: ParsedRow[];
  errors: RowError[];
};

/** Split a single CSV line into fields, handling double-quoted values. */
function splitLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i <= line.length) {
    if (line[i] === '"') {
      // Quoted field
      let value = '';
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          value += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          value += line[i++];
        }
      }
      fields.push(value);
      if (line[i] === ',') i++; // skip comma after closing quote
    } else {
      // Unquoted field — read until comma or end
      const start = i;
      while (i < line.length && line[i] !== ',') i++;
      fields.push(line.slice(start, i));
      if (line[i] === ',') i++; // skip comma
    }
    if (i > line.length) break;
  }
  return fields;
}

export function parseCsvImport(csvText: string): ParseResult {
  const lines = csvText.split('\n').map(l => l.trimEnd());
  const valid: ParsedRow[] = [];
  const errors: RowError[] = [];

  // Skip header (row 1) and blank lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const rowNum = i + 1; // 1-based, header is row 1
    const fields = splitLine(line);

    // Expected columns: sku, barcode, productProfile, nameRu, nameUz
    const [rawSku, rawBarcode, rawProfile, rawNameRu, rawNameUz] = fields;

    const sku = rawSku?.trim() ?? '';
    const barcode = rawBarcode?.trim() || undefined;
    const profile = rawProfile?.trim() ?? '';
    const nameRu = rawNameRu?.trim() ?? '';
    const nameUz = rawNameUz?.trim() ?? '';

    if (!sku) {
      errors.push({ row: rowNum, message: 'sku is required' });
      continue;
    }
    if (profile !== 'accessories' && profile !== 'parts') {
      errors.push({ row: rowNum, message: `productProfile must be 'accessories' or 'parts', got '${profile}'` });
      continue;
    }
    if (!nameRu) {
      errors.push({ row: rowNum, message: 'nameRu is required' });
      continue;
    }
    if (!nameUz) {
      errors.push({ row: rowNum, message: 'nameUz is required' });
      continue;
    }

    valid.push({ sku, barcode, productProfile: profile, nameRu, nameUz });
  }

  return { valid, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- csvParser.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/csvParser.ts lib/__tests__/csvParser.test.ts
git commit -m "feat(lib): add CSV parser with validation"
```

---

## Task 2: Template CSVs + import API route

**Files:**
- Create: `public/templates/aapa-accessories-template.csv`
- Create: `public/templates/aapa-parts-template.csv`
- Create: `app/api/import/products/route.ts`

- [ ] **Step 1: Create `public/templates/aapa-accessories-template.csv`**

```
sku,barcode,productProfile,nameRu,nameUz
ACC-001,,accessories,Название товара на русском,Mahsulot nomi o'zbekcha
ACC-002,4600000000000,accessories,Автошампунь для кузова 500мл,Avtomobil uchun shampun 500ml
```

- [ ] **Step 2: Create `public/templates/aapa-parts-template.csv`**

```
sku,barcode,productProfile,nameRu,nameUz
PRT-001,,parts,Масляный фильтр Toyota Corolla,Toyota Corolla uchun moy filtri
PRT-002,8000000000001,parts,Воздушный фильтр Chevrolet Nexia,Chevrolet Nexia uchun havo filtri
```

- [ ] **Step 3: Create `app/api/import/products/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { parseCsvImport } from '@/lib/csvParser';
import { createProduct } from '@/app/actions/products';

export async function POST(req: NextRequest) {
  let text: string;
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    text = await (file as File).text();
  } catch {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 400 });
  }

  const { valid, errors } = parseCsvImport(text);

  const created: number[] = [];
  const createErrors: { sku: string; message: string }[] = [];

  for (const row of valid) {
    const result = await createProduct(row);
    if ('error' in result) {
      createErrors.push({ sku: row.sku, message: result.error });
    } else {
      created.push(result.id);
    }
  }

  return NextResponse.json({
    createdCount: created.length,
    createdIds: created,
    parseErrors: errors,
    createErrors,
  });
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add public/templates/aapa-accessories-template.csv \
        public/templates/aapa-parts-template.csv \
        app/api/import/products/route.ts
git commit -m "feat(import): add CSV import API route + template files"
```

---

## Task 3: ImportForm component + wire import page

**Files:**
- Create: `components/import/ImportForm.tsx`
- Modify: `app/(app)/import/page.tsx`

- [ ] **Step 1: Create `components/import/ImportForm.tsx`**

```typescript
'use client';

import { useState, useTransition, useRef } from 'react';

type ImportResult = {
  createdCount: number;
  createdIds: number[];
  parseErrors: { row: number; message: string }[];
  createErrors: { sku: string; message: string }[];
};

export function ImportForm() {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import/products', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? 'Upload failed');
        return;
      }

      const data: ImportResult = await res.json();
      setResult(data);
    });
  }

  const totalErrors = (result?.parseErrors.length ?? 0) + (result?.createErrors.length ?? 0);

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-4">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          required
          className="text-sm"
          style={{ color: 'hsl(213 31% 91%)' }}
        />
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: '#f59e0b', color: 'hsl(222 47% 11%)' }}
        >
          {pending ? 'Загрузка…' : 'Импортировать'}
        </button>
      </form>

      {error && (
        <div
          className="p-3 rounded-md text-sm mb-3"
          style={{
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-3">
          {/* Success summary */}
          <div
            className="p-3 rounded-md text-sm"
            style={{
              backgroundColor: result.createdCount > 0 ? 'rgba(34,197,94,0.08)' : 'hsl(222 47% 13%)',
              border: `1px solid ${result.createdCount > 0 ? 'rgba(34,197,94,0.2)' : 'hsl(216 34% 22%)'}`,
              color: result.createdCount > 0 ? '#22c55e' : 'hsl(215 20% 55%)',
            }}
          >
            Создано товаров: {result.createdCount}
            {totalErrors > 0 && (
              <span style={{ color: '#f87171' }}> · Ошибок: {totalErrors}</span>
            )}
          </div>

          {/* Parse errors */}
          {result.parseErrors.length > 0 && (
            <div>
              <p className="text-xs mb-2 font-medium" style={{ color: 'hsl(215 20% 55%)' }}>
                Ошибки парсинга:
              </p>
              <div className="flex flex-col gap-1">
                {result.parseErrors.map((e) => (
                  <div key={e.row} className="text-xs font-mono" style={{ color: '#f87171' }}>
                    Строка {e.row}: {e.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create errors */}
          {result.createErrors.length > 0 && (
            <div>
              <p className="text-xs mb-2 font-medium" style={{ color: 'hsl(215 20% 55%)' }}>
                Ошибки создания:
              </p>
              <div className="flex flex-col gap-1">
                {result.createErrors.map((e) => (
                  <div key={e.sku} className="text-xs font-mono" style={{ color: '#f87171' }}>
                    {e.sku}: {e.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Modify `app/(app)/import/page.tsx`**

Replace the import placeholder section (the dashed-border div at the bottom) with the real ImportForm. Keep the export section unchanged. Full new file:

```typescript
import { ImportForm } from '@/components/import/ImportForm';

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
          CSV импорт и экспорт каталога
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

      {/* Import section */}
      <div
        className="rounded-lg p-6 mb-6"
        style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
      >
        <h2 className="text-sm font-medium mb-1" style={{ color: 'hsl(213 31% 91%)' }}>
          Импорт из CSV
        </h2>
        <p className="text-xs mb-1" style={{ color: 'hsl(215 20% 55%)' }}>
          Загрузите CSV-файл для массового создания товаров. Колонки: sku, barcode, productProfile, nameRu, nameUz
        </p>
        <div className="flex gap-4 mb-4">
          <a
            href="/templates/aapa-accessories-template.csv"
            className="text-xs underline"
            style={{ color: 'hsl(215 20% 55%)' }}
            download
          >
            Шаблон: Аксессуары
          </a>
          <a
            href="/templates/aapa-parts-template.csv"
            className="text-xs underline"
            style={{ color: 'hsl(215 20% 55%)' }}
            download
          >
            Шаблон: Запчасти
          </a>
        </div>
        <ImportForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + run all tests**

Run: `npx tsc --noEmit` — expect exit 0.
Run: `npm test` — all tests pass.

- [ ] **Step 4: Commit**

```bash
git add components/import/ImportForm.tsx "app/(app)/import/page.tsx"
git commit -m "feat(import): add ImportForm component + wire up import page"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ CSV Import: bulk-create product cards from spreadsheet — Tasks 2 + 3
- ✅ Template CSVs: separate templates for Accessories and Parts — Task 2
- ✅ Template columns in English for usability — Task 2
- ✅ Per-row validation with error reporting — Task 1
- ✅ Duplicate SKU error surfaced via `createErrors` — Task 2 (caught by `createProduct`)
- ✅ Upload UI with file input, submit, result display — Task 3

**2. Placeholder scan:** No TBDs. No incomplete code.

**3. Type consistency:**
- `ParsedRow` defined in `lib/csvParser.ts`, matches `createProduct` input shape — consistent
- `ParseResult` defined in `lib/csvParser.ts`, used in API route — consistent
- `ImportResult` defined inline in `ImportForm.tsx`, matches API response shape — consistent
