# AAPA Tracker — Phase 2b: Product Card Editor

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full product card editor with 8 tabbed sections (Card Info, Properties, Media, Profile-specific, Pricing, Fulfillment, Moderation, Performance) plus a new-product flow with profile selection.

**Architecture:** Server actions in `app/actions/products.ts` own all mutations. `getProductById()` added to `lib/queries.ts` fetches full product detail. The detail page is a server component passing data to a client `ProductEditor`. Each tab component manages its own local form state, calls the relevant server action on save, then calls `router.refresh()` to reload server data (which re-computes the score). JSON array fields use line-separated textareas for simple string arrays and dynamic row editors for structured objects.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, better-sqlite3/Drizzle ORM, server actions + `revalidatePath`, `useTransition` + `useRouter`

---

## Context for implementers

- Working directory: `/Users/anvar/Documents/GitHub/aapa-tracker`
- DB is seeded with 7 products (IDs 1–7): 5 accessories (ACC-001 to ACC-005), 2 parts (PRT-001, PRT-002)
- `lib/queries.ts` already exports `getProductListRows()` and `ProductListRow` type — keep both
- `lib/scoring.ts` exports `computeScore(data)` and `ScoreBreakdown` type
- `db/schema.ts` exports: `products`, `productCards`, `productMedia`, `accessoriesData`, `partsData`, `pricing`, `fulfillment`, `performance`, `moderation`, `boost` + inferred types (`Product`, `ProductCard`, `ProductMedia`, `AccessoriesData`, `PartsData`, `Pricing`, `Fulfillment`, `Performance`, `Moderation`, `Boost`)
- `lib/validators.ts` exports `checkPhotoCompliance(media)` returning `{ valid: boolean; violations: string[] }`
- `lib/constants.ts` exports `MODERATION_STATUSES`, `FULFILLMENT_SCHEMES`, `VAT_OPTIONS`, `ACCESSORY_SUBTYPES`, `PART_TYPES`, plus FBO thresholds
- Inline-style palette (match existing Sidebar/ProductTable):
  - page bg: `hsl(222 47% 11%)`
  - elevated card: `hsl(222 47% 15%)`
  - borders: `hsl(216 34% 22%)` / `hsl(216 34% 28%)`
  - primary text: `hsl(213 31% 91%)`
  - muted text: `hsl(215 20% 55%)`
  - amber accent: `#f59e0b` (active/CTA)
- Tests live in `lib/__tests__/` using Vitest, `environment: 'node'` — run with `npm test` (one-shot) or `npm run test:watch`
- Start dev: `npm run dev` (port 3000)
- `productCards` has NO `.unique()` on `productId` — upsert via select-then-branch
- `accessoriesData`, `partsData`, `pricing`, `fulfillment`, `moderation`, `boost` DO have `.unique()` on `productId` — same select-then-branch pattern for consistency
- Path alias `@/` → project root (both tsconfig and vitest)

---

## File Map

**Create:**
- `lib/__tests__/queries.test.ts` — integration test for getProductById
- `lib/__tests__/actions.test.ts` — integration test for createProduct
- `app/actions/products.ts` — all server actions (single file)
- `app/(app)/products/new/page.tsx` — profile selector wrapper
- `app/(app)/products/[id]/page.tsx` — product detail server component
- `app/(app)/products/[id]/edit/page.tsx` — redirect to `/products/[id]`
- `components/product/ProfileSelector.tsx` — new-product profile choice (client)
- `components/product/ProductEditor.tsx` — tabbed editor shell (client)
- `components/product/ScoreBreakdownPanel.tsx` — list of scoring fields with met/unmet ticks
- `components/product/tabs/CardInfoTab.tsx`
- `components/product/tabs/PropertiesTab.tsx`
- `components/product/tabs/MediaTab.tsx`
- `components/product/tabs/AccessoriesTab.tsx`
- `components/product/tabs/PartsTab.tsx`
- `components/product/tabs/PricingTab.tsx`
- `components/product/tabs/FulfillmentTab.tsx`
- `components/product/tabs/ModerationTab.tsx`
- `components/product/tabs/PerformanceTab.tsx`
- `components/product/FormField.tsx` — shared labeled input wrapper (DRY helper for tabs)

**Modify:**
- `lib/queries.ts` — add `getProductById()` + `ProductDetail` type (keep existing export)
- `components/product/ProductTable.tsx` — wrap rows with `next/link` to `/products/[id]`
- `app/(app)/products/page.tsx` — add "Добавить товар" link to `/products/new`

---

## Task 1: `getProductById` query + test

**Files:**
- Modify: `lib/queries.ts`
- Create: `lib/__tests__/queries.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/queries.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getProductById } from '@/lib/queries';

describe('getProductById', () => {
  it('returns full product detail for seeded accessories product (id=1, ACC-001)', async () => {
    const detail = await getProductById(1);
    expect(detail).not.toBeNull();
    expect(detail!.product.sku).toBe('ACC-001');
    expect(detail!.product.productProfile).toBe('accessories');
    expect(detail!.card).not.toBeNull();
    expect(detail!.accessoriesData).not.toBeNull();
    expect(detail!.partsData).toBeNull();
    expect(detail!.media.length).toBeGreaterThan(0);
    expect(detail!.score.total).toBeGreaterThan(0);
    expect(detail!.score.fields.length).toBeGreaterThan(0);
  });

  it('returns full product detail for seeded parts product (PRT-001)', async () => {
    const detail = await getProductById(6);
    expect(detail).not.toBeNull();
    expect(detail!.product.sku).toBe('PRT-001');
    expect(detail!.product.productProfile).toBe('parts');
    expect(detail!.partsData).not.toBeNull();
    expect(detail!.accessoriesData).toBeNull();
  });

  it('returns null for non-existent product', async () => {
    const detail = await getProductById(999);
    expect(detail).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- queries.test.ts`
Expected: FAIL — `getProductById is not a function` or similar.

- [ ] **Step 3: Add `ProductDetail` type and `getProductById` to `lib/queries.ts`**

Append to `lib/queries.ts`:

```typescript
import { desc } from 'drizzle-orm';
import { boost, performance } from '@/db/schema';
import type {
  Product, ProductCard, ProductMedia, AccessoriesData, PartsData,
  Pricing, Fulfillment, Moderation, Boost, Performance,
} from '@/db/schema';

export type ProductDetail = {
  product: Product;
  card: ProductCard | null;
  media: ProductMedia[];
  accessoriesData: AccessoriesData | null;
  partsData: PartsData | null;
  pricing: Pricing | null;
  fulfillment: Fulfillment | null;
  moderation: Moderation | null;
  boost: Boost | null;
  performance: Performance[];
  score: ScoreBreakdown;
};

export async function getProductById(id: number): Promise<ProductDetail | null> {
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) return null;

  const [card] = await db.select().from(productCards).where(eq(productCards.productId, id));
  const media = await db.select().from(productMedia).where(eq(productMedia.productId, id));
  const [acc] = await db.select().from(accessoriesData).where(eq(accessoriesData.productId, id));
  const [parts] = await db.select().from(partsData).where(eq(partsData.productId, id));
  const [price] = await db.select().from(pricing).where(eq(pricing.productId, id));
  const [ful] = await db.select().from(fulfillment).where(eq(fulfillment.productId, id));
  const [mod] = await db.select().from(moderation).where(eq(moderation.productId, id));
  const [bst] = await db.select().from(boost).where(eq(boost.productId, id));
  const perf = await db
    .select()
    .from(performance)
    .where(eq(performance.productId, id))
    .orderBy(desc(performance.date));

  const score = computeScore({
    profile: product.productProfile,
    card: card ?? {},
    media: media ?? [],
    accessoriesData: acc ?? null,
    partsData: parts ?? null,
    pricing: price ?? null,
  });

  return {
    product,
    card: card ?? null,
    media,
    accessoriesData: acc ?? null,
    partsData: parts ?? null,
    pricing: price ?? null,
    fulfillment: ful ?? null,
    moderation: mod ?? null,
    boost: bst ?? null,
    performance: perf,
    score,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- queries.test.ts`
Expected: PASS (all 3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/queries.ts lib/__tests__/queries.test.ts
git commit -m "feat(lib): add getProductById query with full product detail"
```

---

## Task 2: Server actions + createProduct test

**Files:**
- Create: `app/actions/products.ts`
- Create: `lib/__tests__/actions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/actions.test.ts`:

```typescript
import { describe, it, expect, afterAll } from 'vitest';
import { createProduct } from '@/app/actions/products';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

const createdSkus: string[] = [];

afterAll(async () => {
  // Clean up any test products
  for (const sku of createdSkus) {
    await db.delete(products).where(eq(products.sku, sku));
  }
});

describe('createProduct', () => {
  it('creates an accessories product with fulfillment+moderation rows', async () => {
    const sku = `TEST-ACC-${Date.now()}`;
    createdSkus.push(sku);

    const result = await createProduct({
      sku,
      productProfile: 'accessories',
      nameRu: 'Тестовый товар',
      nameUz: 'Test mahsulot',
    });

    expect('id' in result).toBe(true);
    if ('id' in result) {
      const [row] = await db.select().from(products).where(eq(products.id, result.id));
      expect(row.sku).toBe(sku);
      expect(row.productProfile).toBe('accessories');
    }
  });

  it('returns error on duplicate SKU', async () => {
    const sku = `TEST-DUP-${Date.now()}`;
    createdSkus.push(sku);
    await createProduct({ sku, productProfile: 'parts', nameRu: 'А', nameUz: 'A' });
    const result = await createProduct({ sku, productProfile: 'parts', nameRu: 'Б', nameUz: 'B' });
    expect('error' in result).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- actions.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `app/actions/products.ts`**

```typescript
'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import {
  products, productCards, productMedia, accessoriesData, partsData,
  pricing, fulfillment, moderation, boost,
} from '@/db/schema';
import { checkPhotoCompliance } from '@/lib/validators';
import type { ProductMedia } from '@/db/schema';

type ActionResult<T = { ok: true }> = T | { error: string };

function toError(e: unknown): { error: string } {
  return { error: e instanceof Error ? e.message : 'Unknown error' };
}

export async function createProduct(data: {
  sku: string;
  barcode?: string;
  productProfile: 'accessories' | 'parts';
  nameRu: string;
  nameUz: string;
}): Promise<ActionResult<{ id: number }>> {
  try {
    const result = await db.insert(products).values({
      sku: data.sku,
      barcode: data.barcode ?? null,
      productProfile: data.productProfile,
      nameRu: data.nameRu,
      nameUz: data.nameUz,
    }).returning({ id: products.id });

    const id = result[0].id;

    // Bootstrap required 1:1 rows so list page and editor don't see null gaps
    await db.insert(fulfillment).values({ productId: id, scheme: 'FBS', stockQuantity: 0 });
    await db.insert(moderation).values({ productId: id, status: 'draft' });
    await db.insert(productCards).values({ productId: id });
    if (data.productProfile === 'accessories') {
      await db.insert(accessoriesData).values({ productId: id });
    } else {
      await db.insert(partsData).values({ productId: id });
    }

    revalidatePath('/products');
    return { id };
  } catch (e) {
    return toError(e);
  }
}

export async function updateProduct(productId: number, data: {
  sku?: string;
  barcode?: string | null;
  nameRu?: string;
  nameUz?: string;
}): Promise<ActionResult> {
  try {
    await db.update(products)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(products.id, productId));
    revalidatePath(`/products/${productId}`);
    revalidatePath('/products');
    return { ok: true };
  } catch (e) {
    return toError(e);
  }
}

export async function updateCardInfo(productId: number, data: {
  titleRu?: string | null;
  titleUz?: string | null;
  descriptionRu?: string | null;
  descriptionUz?: string | null;
  shortDescRu?: string | null;
  shortDescUz?: string | null;
  brand?: string | null;
  vatPct?: number | null;
  weightKg?: number | null;
  dimLengthCm?: number | null;
  dimWidthCm?: number | null;
  dimHeightCm?: number | null;
}): Promise<ActionResult> {
  try {
    const existing = await db.select({ id: productCards.id })
      .from(productCards).where(eq(productCards.productId, productId)).limit(1);
    if (existing.length > 0) {
      await db.update(productCards).set(data).where(eq(productCards.productId, productId));
    } else {
      await db.insert(productCards).values({ productId, ...data });
    }
    revalidatePath(`/products/${productId}`);
    return { ok: true };
  } catch (e) {
    return toError(e);
  }
}

export async function updateProperties(productId: number, data: {
  propertiesRu?: string | null;
  propertiesUz?: string | null;
  characteristics?: string | null;
  filterProperties?: string | null;
}): Promise<ActionResult> {
  try {
    const existing = await db.select({ id: productCards.id })
      .from(productCards).where(eq(productCards.productId, productId)).limit(1);
    if (existing.length > 0) {
      await db.update(productCards).set(data).where(eq(productCards.productId, productId));
    } else {
      await db.insert(productCards).values({ productId, ...data });
    }
    revalidatePath(`/products/${productId}`);
    return { ok: true };
  } catch (e) {
    return toError(e);
  }
}

export async function updateAccessoriesData(productId: number, data: Partial<{
  universalFit: boolean | null;
  useCaseRu: string | null;
  useCaseUz: string | null;
  materialRu: string | null;
  materialUz: string | null;
  colorOptions: string | null;
  volumeMl: number | null;
  applicationMethodRu: string | null;
  applicationMethodUz: string | null;
  kitContentsRu: string | null;
  kitContentsUz: string | null;
  bundleInfo: string | null;
}>): Promise<ActionResult> {
  try {
    const existing = await db.select({ id: accessoriesData.id })
      .from(accessoriesData).where(eq(accessoriesData.productId, productId)).limit(1);
    if (existing.length > 0) {
      await db.update(accessoriesData).set(data).where(eq(accessoriesData.productId, productId));
    } else {
      await db.insert(accessoriesData).values({ productId, ...data });
    }
    revalidatePath(`/products/${productId}`);
    return { ok: true };
  } catch (e) {
    return toError(e);
  }
}

export async function updatePartsData(productId: number, data: Partial<{
  oemNumber: string | null;
  crossReferences: string | null;
  compatibleModels: string | null;
  positionRu: string | null;
  positionUz: string | null;
  partLengthMm: number | null;
  partWidthMm: number | null;
  partHeightMm: number | null;
  partWeightG: number | null;
  warrantyMonths: number | null;
  materialSpec: string | null;
}>): Promise<ActionResult> {
  try {
    const existing = await db.select({ id: partsData.id })
      .from(partsData).where(eq(partsData.productId, productId)).limit(1);
    if (existing.length > 0) {
      await db.update(partsData).set(data).where(eq(partsData.productId, productId));
    } else {
      await db.insert(partsData).values({ productId, ...data });
    }
    revalidatePath(`/products/${productId}`);
    return { ok: true };
  } catch (e) {
    return toError(e);
  }
}

export async function updatePricing(productId: number, data: Partial<{
  costPrice: number | null;
  sellingPrice: number | null;
  discountPrice: number | null;
  marginPct: number | null;
  competitorPrice: number | null;
  competitorUrl: string | null;
}>): Promise<ActionResult> {
  try {
    const payload = { ...data, updatedAt: new Date().toISOString() };
    const existing = await db.select({ id: pricing.id })
      .from(pricing).where(eq(pricing.productId, productId)).limit(1);
    if (existing.length > 0) {
      await db.update(pricing).set(payload).where(eq(pricing.productId, productId));
    } else {
      await db.insert(pricing).values({ productId, ...payload });
    }
    revalidatePath(`/products/${productId}`);
    revalidatePath('/products');
    return { ok: true };
  } catch (e) {
    return toError(e);
  }
}

export async function updateFulfillment(productId: number, data: Partial<{
  scheme: 'FBS' | 'FBO' | 'DBS' | 'EDBS';
  stockQuantity: number;
  fboTurnoverDays: number | null;
  isOversized: boolean;
}>): Promise<ActionResult> {
  try {
    const existing = await db.select({ id: fulfillment.id })
      .from(fulfillment).where(eq(fulfillment.productId, productId)).limit(1);
    if (existing.length > 0) {
      await db.update(fulfillment).set(data).where(eq(fulfillment.productId, productId));
    } else {
      await db.insert(fulfillment).values({
        productId,
        scheme: data.scheme ?? 'FBS',
        stockQuantity: data.stockQuantity ?? 0,
        fboTurnoverDays: data.fboTurnoverDays ?? null,
        isOversized: data.isOversized ?? false,
      });
    }
    revalidatePath(`/products/${productId}`);
    revalidatePath('/products');
    return { ok: true };
  } catch (e) {
    return toError(e);
  }
}

export async function updateModeration(productId: number, data: Partial<{
  status: 'draft' | 'ready' | 'on_sale' | 'blocked' | 'archived';
  blockReason: string | null;
}>): Promise<ActionResult> {
  try {
    const payload = { ...data, updatedAt: new Date().toISOString() };
    const existing = await db.select({ id: moderation.id })
      .from(moderation).where(eq(moderation.productId, productId)).limit(1);
    if (existing.length > 0) {
      await db.update(moderation).set(payload).where(eq(moderation.productId, productId));
    } else {
      await db.insert(moderation).values({
        productId,
        status: data.status ?? 'draft',
        blockReason: data.blockReason ?? null,
      });
    }
    revalidatePath(`/products/${productId}`);
    revalidatePath('/products');
    return { ok: true };
  } catch (e) {
    return toError(e);
  }
}

export async function updateBoost(productId: number, data: Partial<{
  campaignType: string | null;
  bidPer1000: number | null;
  dailyBudget: number | null;
  totalBudget: number | null;
  keywords: string | null;
  negativeKeywords: string | null;
  drrPct: number | null;
}>): Promise<ActionResult> {
  try {
    const existing = await db.select({ id: boost.id })
      .from(boost).where(eq(boost.productId, productId)).limit(1);
    if (existing.length > 0) {
      await db.update(boost).set(data).where(eq(boost.productId, productId));
    } else {
      await db.insert(boost).values({ productId, ...data });
    }
    revalidatePath(`/products/${productId}`);
    return { ok: true };
  } catch (e) {
    return toError(e);
  }
}

export async function addMedia(productId: number, data: {
  url: string;
  mediaType: 'photo' | 'video';
  widthPx?: number | null;
  heightPx?: number | null;
  sizeBytes?: number | null;
  isPrimary?: boolean;
}): Promise<ActionResult<{ id: number }>> {
  try {
    // Compute compliance for photos
    let isCompliant: boolean | null = null;
    let complianceNotes: string | null = null;
    if (data.mediaType === 'photo') {
      const check = checkPhotoCompliance({
        mediaType: 'photo',
        widthPx: data.widthPx ?? null,
        heightPx: data.heightPx ?? null,
        sizeBytes: data.sizeBytes ?? null,
      } as Pick<ProductMedia, 'widthPx' | 'heightPx' | 'sizeBytes' | 'mediaType'>);
      isCompliant = check.valid;
      complianceNotes = check.violations.length ? check.violations.join('; ') : null;
    }

    // If this one is primary, clear existing primaries for this product
    if (data.isPrimary) {
      await db.update(productMedia)
        .set({ isPrimary: false })
        .where(eq(productMedia.productId, productId));
    }

    // orderIndex = current count (append to end)
    const current = await db.select().from(productMedia).where(eq(productMedia.productId, productId));
    const orderIndex = current.length;

    const inserted = await db.insert(productMedia).values({
      productId,
      url: data.url,
      mediaType: data.mediaType,
      widthPx: data.widthPx ?? null,
      heightPx: data.heightPx ?? null,
      sizeBytes: data.sizeBytes ?? null,
      isPrimary: data.isPrimary ?? false,
      orderIndex,
      isCompliant,
      complianceNotes,
    }).returning({ id: productMedia.id });

    revalidatePath(`/products/${productId}`);
    revalidatePath('/products');
    return { id: inserted[0].id };
  } catch (e) {
    return toError(e);
  }
}

export async function deleteMedia(mediaId: number, productId: number): Promise<ActionResult> {
  try {
    await db.delete(productMedia).where(eq(productMedia.id, mediaId));
    revalidatePath(`/products/${productId}`);
    revalidatePath('/products');
    return { ok: true };
  } catch (e) {
    return toError(e);
  }
}

export async function setPrimaryMedia(mediaId: number, productId: number): Promise<ActionResult> {
  try {
    await db.update(productMedia)
      .set({ isPrimary: false })
      .where(eq(productMedia.productId, productId));
    await db.update(productMedia)
      .set({ isPrimary: true })
      .where(eq(productMedia.id, mediaId));
    revalidatePath(`/products/${productId}`);
    return { ok: true };
  } catch (e) {
    return toError(e);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- actions.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add app/actions/products.ts lib/__tests__/actions.test.ts
git commit -m "feat(actions): add product server actions (create + per-tab updates + media)"
```

---

## Task 3: Clickable table rows + "Add Product" button

**Files:**
- Modify: `components/product/ProductTable.tsx`
- Modify: `app/(app)/products/page.tsx`

- [ ] **Step 1: Wrap ProductTable rows with Link**

In `components/product/ProductTable.tsx`, add import at top:

```typescript
import Link from 'next/link';
import { useRouter } from 'next/navigation';
```

Inside `ProductTable`, add above the `return`:

```typescript
const router = useRouter();
```

Replace the opening `<tr key={row.id}` through the `onMouseLeave` handler with this (keeps hover effect, makes whole row clickable via programmatic navigation):

```typescript
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
```

(Keep the rest of the row contents unchanged. The `cursor-pointer` class + `onClick` navigate on any cell click.)

`Link` import can be removed if only `useRouter` is used — but leave it in if future tasks need it. For now, remove the unused `Link` import to satisfy TS strict.

- [ ] **Step 2: Add "Добавить товар" button to products page**

In `app/(app)/products/page.tsx`, add import:

```typescript
import Link from 'next/link';
import { Plus } from 'lucide-react';
```

Replace the `<div className="flex items-center gap-3">` summary-pills block with this (adds the button at the end, next to pills):

```typescript
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
  <Link
    href="/products/new"
    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
    style={{
      backgroundColor: '#f59e0b',
      color: 'hsl(222 47% 11%)',
    }}
  >
    <Plus size={14} strokeWidth={2.5} />
    Добавить товар
  </Link>
</div>
```

- [ ] **Step 3: Verify build / typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run dev`, open http://localhost:3000/products, click any row.
Expected: browser navigates to `/products/<id>` (will 404 until Task 5 — that's fine for now).
Click "Добавить товар" → 404 until Task 4.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add components/product/ProductTable.tsx app/\(app\)/products/page.tsx
git commit -m "feat(products): make rows clickable + add new-product CTA"
```

---

## Task 4: ProfileSelector + new product page

**Files:**
- Create: `components/product/ProfileSelector.tsx`
- Create: `app/(app)/products/new/page.tsx`

- [ ] **Step 1: Create `ProfileSelector.tsx`**

```typescript
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/app/actions/products';

type Profile = 'accessories' | 'parts';

export function ProfileSelector() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sku, setSku] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [nameUz, setNameUz] = useState('');
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    startTransition(async () => {
      const result = await createProduct({
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        productProfile: profile,
        nameRu: nameRu.trim(),
        nameUz: nameUz.trim(),
      });
      if ('error' in result) {
        setError(result.error);
        return;
      }
      router.push(`/products/${result.id}`);
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step 1: profile */}
      <div className="mb-6">
        <h2
          className="text-sm font-medium mb-3 uppercase tracking-wider"
          style={{ color: 'hsl(215 20% 55%)' }}
        >
          Шаг 1. Выберите профиль
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setProfile('accessories')}
            className="p-6 rounded-lg text-left transition-all"
            style={{
              backgroundColor: profile === 'accessories' ? 'rgba(245, 158, 11, 0.1)' : 'hsl(222 47% 15%)',
              border: `2px solid ${profile === 'accessories' ? '#f59e0b' : 'hsl(216 34% 22%)'}`,
            }}
          >
            <div
              className="inline-flex items-center justify-center w-10 h-10 rounded-md font-mono font-bold text-lg mb-3"
              style={{ backgroundColor: '#f59e0b', color: 'hsl(222 47% 11%)' }}
            >
              A
            </div>
            <div className="text-base font-semibold" style={{ color: 'hsl(213 31% 91%)' }}>
              Аксессуары
            </div>
            <div className="text-xs mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
              Автохимия, косметика, чехлы, инструменты · 80% каталога
            </div>
          </button>
          <button
            type="button"
            onClick={() => setProfile('parts')}
            className="p-6 rounded-lg text-left transition-all"
            style={{
              backgroundColor: profile === 'parts' ? 'rgba(59, 130, 246, 0.1)' : 'hsl(222 47% 15%)',
              border: `2px solid ${profile === 'parts' ? '#3b82f6' : 'hsl(216 34% 22%)'}`,
            }}
          >
            <div
              className="inline-flex items-center justify-center w-10 h-10 rounded-md font-mono font-bold text-lg mb-3"
              style={{ backgroundColor: '#3b82f6', color: 'white' }}
            >
              P
            </div>
            <div className="text-base font-semibold" style={{ color: 'hsl(213 31% 91%)' }}>
              Запчасти
            </div>
            <div className="text-xs mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
              OEM, кросс-номера, совместимые модели · 20% каталога
            </div>
          </button>
        </div>
      </div>

      {/* Step 2: basic fields */}
      {profile && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
        >
          <h2
            className="text-sm font-medium mb-4 uppercase tracking-wider"
            style={{ color: 'hsl(215 20% 55%)' }}
          >
            Шаг 2. Основные данные
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU *" required>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono"
                style={inputStyle}
              />
            </Field>
            <Field label="Штрих-код">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono"
                style={inputStyle}
              />
            </Field>
            <Field label="Название (RU) *" required>
              <input
                type="text"
                required
                value={nameRu}
                onChange={(e) => setNameRu(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-md outline-none"
                style={inputStyle}
              />
            </Field>
            <Field label="Название (UZ) *" required>
              <input
                type="text"
                required
                value={nameUz}
                onChange={(e) => setNameUz(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-md outline-none"
                style={inputStyle}
              />
            </Field>
          </div>
          {error && (
            <div
              className="mt-4 p-3 rounded-md text-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
              }}
            >
              {error}
            </div>
          )}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#f59e0b', color: 'hsl(222 47% 11%)' }}
            >
              {pending ? 'Создание…' : 'Создать товар'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  backgroundColor: 'hsl(222 47% 11%)',
  color: 'hsl(213 31% 91%)',
  border: '1px solid hsl(216 34% 28%)',
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs mb-1.5" style={{ color: 'hsl(215 20% 55%)' }}>
        {label}
      </span>
      {children}
    </label>
  );
}
```

- [ ] **Step 2: Create `app/(app)/products/new/page.tsx`**

```typescript
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProfileSelector } from '@/components/product/ProfileSelector';

export default function NewProductPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm mb-4 hover:text-amber-400 transition-colors"
          style={{ color: 'hsl(215 20% 55%)' }}
        >
          <ArrowLeft size={14} />
          Назад к списку
        </Link>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: 'hsl(213 31% 91%)' }}
        >
          Новый товар
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
          Выберите профиль и заполните основные поля
        </p>
      </div>
      <ProfileSelector />
    </div>
  );
}
```

- [ ] **Step 3: Manually test the flow**

Run: `npm run dev`. Open http://localhost:3000/products/new.
- Pick "Аксессуары", fill SKU `TEST-MANUAL`, name RU/UZ, submit.
- Expected: browser navigates to `/products/<id>` (still 404 until Task 5).
- Check DB: a new product row with profile `accessories` should exist.

Manually delete the test row:
```bash
sqlite3 data/aapa-tracker.db "DELETE FROM products WHERE sku = 'TEST-MANUAL';"
```

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add components/product/ProfileSelector.tsx app/\(app\)/products/new/page.tsx
git commit -m "feat(products): add profile selector + new product page"
```

---

## Task 5: Product detail page + ProductEditor shell + ScoreBreakdownPanel + FormField helper + /edit redirect

**Files:**
- Create: `app/(app)/products/[id]/page.tsx`
- Create: `app/(app)/products/[id]/edit/page.tsx`
- Create: `components/product/ProductEditor.tsx`
- Create: `components/product/ScoreBreakdownPanel.tsx`
- Create: `components/product/FormField.tsx`

- [ ] **Step 1: Create `components/product/FormField.tsx`** (shared labeled-input wrapper used by all tabs)

```typescript
import type { CSSProperties, ReactNode } from 'react';

export const inputStyle: CSSProperties = {
  backgroundColor: 'hsl(222 47% 11%)',
  color: 'hsl(213 31% 91%)',
  border: '1px solid hsl(216 34% 28%)',
};

export function FormField({
  label, hint, children, span = 1,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  span?: 1 | 2 | 3 | 4;
}) {
  const colSpan = { 1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4' }[span];
  return (
    <label className={`block ${colSpan}`}>
      <span className="block text-xs mb-1.5" style={{ color: 'hsl(215 20% 55%)' }}>
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[10px] mt-1" style={{ color: 'hsl(215 20% 40%)' }}>
          {hint}
        </span>
      )}
    </label>
  );
}
```

- [ ] **Step 2: Create `components/product/ScoreBreakdownPanel.tsx`**

```typescript
import { Check, X } from 'lucide-react';
import type { ScoreBreakdown } from '@/lib/scoring';

export function ScoreBreakdownPanel({ score }: { score: ScoreBreakdown }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs uppercase tracking-wider font-medium" style={{ color: 'hsl(215 20% 55%)' }}>
          Разбор score
        </span>
        <span className="font-mono text-xs" style={{ color: 'hsl(215 20% 65%)' }}>
          {score.total}/{score.maxPossible}
        </span>
      </div>
      <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
        {score.fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {f.met ? (
                <Check size={12} className="shrink-0" style={{ color: '#22c55e' }} />
              ) : (
                <X size={12} className="shrink-0" style={{ color: '#ef4444' }} />
              )}
              <span
                className="truncate"
                style={{ color: f.met ? 'hsl(213 31% 85%)' : 'hsl(215 20% 55%)' }}
              >
                {f.label}
              </span>
            </div>
            <span
              className="font-mono shrink-0"
              style={{ color: f.met ? '#22c55e' : 'hsl(215 20% 45%)' }}
            >
              {f.earned}/{f.weight}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/product/ProductEditor.tsx`**

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import { ProfileBadge } from '@/components/common/ProfileBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ScoreBreakdownPanel } from './ScoreBreakdownPanel';
import { CardInfoTab } from './tabs/CardInfoTab';
import { PropertiesTab } from './tabs/PropertiesTab';
import { MediaTab } from './tabs/MediaTab';
import { AccessoriesTab } from './tabs/AccessoriesTab';
import { PartsTab } from './tabs/PartsTab';
import { PricingTab } from './tabs/PricingTab';
import { FulfillmentTab } from './tabs/FulfillmentTab';
import { ModerationTab } from './tabs/ModerationTab';
import { PerformanceTab } from './tabs/PerformanceTab';
import type { ProductDetail } from '@/lib/queries';

type TabKey =
  | 'info' | 'properties' | 'media' | 'profile'
  | 'pricing' | 'fulfillment' | 'moderation' | 'performance';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'Карточка' },
  { key: 'properties', label: 'Свойства' },
  { key: 'media', label: 'Медиа' },
  { key: 'profile', label: 'Профиль' },
  { key: 'pricing', label: 'Цены' },
  { key: 'fulfillment', label: 'Логистика' },
  { key: 'moderation', label: 'Модерация' },
  { key: 'performance', label: 'Метрики' },
];

export function ProductEditor({ detail }: { detail: ProductDetail }) {
  const [tab, setTab] = useState<TabKey>('info');
  const productId = detail.product.id;

  return (
    <div className="px-8 py-8">
      {/* Back */}
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm mb-4 hover:text-amber-400 transition-colors"
        style={{ color: 'hsl(215 20% 55%)' }}
      >
        <ArrowLeft size={14} />
        Назад к списку
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-6">
        <div className="flex items-start gap-4 min-w-0">
          <ProfileBadge profile={detail.product.productProfile} />
          <div className="min-w-0">
            <h1
              className="text-2xl font-semibold tracking-tight truncate"
              style={{ color: 'hsl(213 31% 91%)' }}
            >
              {detail.product.nameRu}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span className="font-mono" style={{ color: 'hsl(215 20% 55%)' }}>
                {detail.product.sku}
              </span>
              {detail.moderation && <StatusBadge status={detail.moderation.status} />}
            </div>
          </div>
        </div>
        <ScoreBadge score={detail.score.total} size={64} />
      </div>

      {/* Two-column layout: tabs + breakdown */}
      <div className="grid grid-cols-[1fr_280px] gap-6">
        <div>
          {/* Tab bar */}
          <div
            className="flex items-center gap-1 p-1 rounded-lg mb-5 overflow-x-auto"
            style={{ backgroundColor: 'hsl(222 47% 13%)', border: '1px solid hsl(216 34% 22%)' }}
          >
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap"
                  style={
                    active
                      ? { backgroundColor: '#f59e0b', color: 'hsl(222 47% 11%)' }
                      : { color: 'hsl(215 20% 55%)' }
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div>
            {tab === 'info' && (
              <CardInfoTab productId={productId} product={detail.product} card={detail.card} />
            )}
            {tab === 'properties' && (
              <PropertiesTab productId={productId} card={detail.card} />
            )}
            {tab === 'media' && (
              <MediaTab productId={productId} media={detail.media} />
            )}
            {tab === 'profile' && detail.product.productProfile === 'accessories' && (
              <AccessoriesTab productId={productId} data={detail.accessoriesData} />
            )}
            {tab === 'profile' && detail.product.productProfile === 'parts' && (
              <PartsTab productId={productId} data={detail.partsData} />
            )}
            {tab === 'pricing' && (
              <PricingTab productId={productId} pricing={detail.pricing} />
            )}
            {tab === 'fulfillment' && (
              <FulfillmentTab productId={productId} fulfillment={detail.fulfillment} />
            )}
            {tab === 'moderation' && (
              <ModerationTab
                productId={productId}
                moderation={detail.moderation}
                boost={detail.boost}
              />
            )}
            {tab === 'performance' && (
              <PerformanceTab performance={detail.performance} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside>
          <ScoreBreakdownPanel score={detail.score} />
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `app/(app)/products/[id]/page.tsx`**

```typescript
import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/queries';
import { ProductEditor } from '@/components/product/ProductEditor';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const detail = await getProductById(id);
  if (!detail) notFound();
  return <ProductEditor detail={detail} />;
}
```

- [ ] **Step 5: Create `app/(app)/products/[id]/edit/page.tsx`** (redirect)

```typescript
import { redirect } from 'next/navigation';

export default function ProductEditRedirect({ params }: { params: { id: string } }) {
  redirect(`/products/${params.id}`);
}
```

- [ ] **Step 6: Create placeholder tab files so ProductEditor compiles**

Create each of the 9 tab files at `components/product/tabs/` with minimal placeholder content. These will be filled out in Tasks 6–13. Use exactly this placeholder body for all of them, substituting the component name:

`components/product/tabs/CardInfoTab.tsx`:
```typescript
import type { Product, ProductCard } from '@/db/schema';

export function CardInfoTab(_: { productId: number; product: Product; card: ProductCard | null }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">CardInfoTab placeholder</div>;
}
```

`components/product/tabs/PropertiesTab.tsx`:
```typescript
import type { ProductCard } from '@/db/schema';
export function PropertiesTab(_: { productId: number; card: ProductCard | null }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">PropertiesTab placeholder</div>;
}
```

`components/product/tabs/MediaTab.tsx`:
```typescript
import type { ProductMedia } from '@/db/schema';
export function MediaTab(_: { productId: number; media: ProductMedia[] }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">MediaTab placeholder</div>;
}
```

`components/product/tabs/AccessoriesTab.tsx`:
```typescript
import type { AccessoriesData } from '@/db/schema';
export function AccessoriesTab(_: { productId: number; data: AccessoriesData | null }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">AccessoriesTab placeholder</div>;
}
```

`components/product/tabs/PartsTab.tsx`:
```typescript
import type { PartsData } from '@/db/schema';
export function PartsTab(_: { productId: number; data: PartsData | null }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">PartsTab placeholder</div>;
}
```

`components/product/tabs/PricingTab.tsx`:
```typescript
import type { Pricing } from '@/db/schema';
export function PricingTab(_: { productId: number; pricing: Pricing | null }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">PricingTab placeholder</div>;
}
```

`components/product/tabs/FulfillmentTab.tsx`:
```typescript
import type { Fulfillment } from '@/db/schema';
export function FulfillmentTab(_: { productId: number; fulfillment: Fulfillment | null }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">FulfillmentTab placeholder</div>;
}
```

`components/product/tabs/ModerationTab.tsx`:
```typescript
import type { Moderation, Boost } from '@/db/schema';
export function ModerationTab(_: { productId: number; moderation: Moderation | null; boost: Boost | null }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">ModerationTab placeholder</div>;
}
```

`components/product/tabs/PerformanceTab.tsx`:
```typescript
import type { Performance } from '@/db/schema';
export function PerformanceTab(_: { performance: Performance[] }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">PerformanceTab placeholder</div>;
}
```

- [ ] **Step 7: Typecheck + manual smoke test**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run dev`, open http://localhost:3000/products, click a row.
Expected: editor renders with tabs + score sidebar. All tabs show placeholder text. Clicking tabs works.

Stop dev server.

- [ ] **Step 8: Commit**

```bash
git add components/product/FormField.tsx components/product/ScoreBreakdownPanel.tsx \
        components/product/ProductEditor.tsx components/product/tabs \
        "app/(app)/products/[id]"
git commit -m "feat(editor): add product editor shell, score panel, tab placeholders"
```

---

## Task 6: CardInfoTab

**Files:**
- Modify (replace placeholder): `components/product/tabs/CardInfoTab.tsx`

- [ ] **Step 1: Implement CardInfoTab**

Replace `components/product/tabs/CardInfoTab.tsx` with:

```typescript
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField, inputStyle } from '@/components/product/FormField';
import { updateCardInfo, updateProduct } from '@/app/actions/products';
import { VAT_OPTIONS } from '@/lib/constants';
import type { Product, ProductCard } from '@/db/schema';

type Props = { productId: number; product: Product; card: ProductCard | null };

export function CardInfoTab({ productId, product, card }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Root product fields
  const [nameRu, setNameRu] = useState(product.nameRu);
  const [nameUz, setNameUz] = useState(product.nameUz);
  const [barcode, setBarcode] = useState(product.barcode ?? '');

  // Card fields
  const [titleRu, setTitleRu] = useState(card?.titleRu ?? '');
  const [titleUz, setTitleUz] = useState(card?.titleUz ?? '');
  const [descriptionRu, setDescriptionRu] = useState(card?.descriptionRu ?? '');
  const [descriptionUz, setDescriptionUz] = useState(card?.descriptionUz ?? '');
  const [shortDescRu, setShortDescRu] = useState(card?.shortDescRu ?? '');
  const [shortDescUz, setShortDescUz] = useState(card?.shortDescUz ?? '');
  const [brand, setBrand] = useState(card?.brand ?? '');
  const [vatPct, setVatPct] = useState<number | ''>(card?.vatPct ?? '');
  const [weightKg, setWeightKg] = useState<number | ''>(card?.weightKg ?? '');
  const [dimLength, setDimLength] = useState<number | ''>(card?.dimLengthCm ?? '');
  const [dimWidth, setDimWidth] = useState<number | ''>(card?.dimWidthCm ?? '');
  const [dimHeight, setDimHeight] = useState<number | ''>(card?.dimHeightCm ?? '');

  // Sync from server when detail refreshes
  useEffect(() => {
    setNameRu(product.nameRu);
    setNameUz(product.nameUz);
    setBarcode(product.barcode ?? '');
  }, [product.nameRu, product.nameUz, product.barcode]);
  useEffect(() => {
    setTitleRu(card?.titleRu ?? '');
    setTitleUz(card?.titleUz ?? '');
    setDescriptionRu(card?.descriptionRu ?? '');
    setDescriptionUz(card?.descriptionUz ?? '');
    setShortDescRu(card?.shortDescRu ?? '');
    setShortDescUz(card?.shortDescUz ?? '');
    setBrand(card?.brand ?? '');
    setVatPct(card?.vatPct ?? '');
    setWeightKg(card?.weightKg ?? '');
    setDimLength(card?.dimLengthCm ?? '');
    setDimWidth(card?.dimWidthCm ?? '');
    setDimHeight(card?.dimHeightCm ?? '');
  }, [card]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const r1 = await updateProduct(productId, {
        nameRu: nameRu.trim(),
        nameUz: nameUz.trim(),
        barcode: barcode.trim() || null,
      });
      if ('error' in r1) { setError(r1.error); return; }

      const r2 = await updateCardInfo(productId, {
        titleRu: titleRu.trim() || null,
        titleUz: titleUz.trim() || null,
        descriptionRu: descriptionRu.trim() || null,
        descriptionUz: descriptionUz.trim() || null,
        shortDescRu: shortDescRu.trim() || null,
        shortDescUz: shortDescUz.trim() || null,
        brand: brand.trim() || null,
        vatPct: vatPct === '' ? null : Number(vatPct),
        weightKg: weightKg === '' ? null : Number(weightKg),
        dimLengthCm: dimLength === '' ? null : Number(dimLength),
        dimWidthCm: dimWidth === '' ? null : Number(dimWidth),
        dimHeightCm: dimHeight === '' ? null : Number(dimHeight),
      });
      if ('error' in r2) { setError(r2.error); return; }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Основное">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Название (RU) *">
            <input type="text" required value={nameRu} onChange={(e) => setNameRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Название (UZ) *">
            <input type="text" required value={nameUz} onChange={(e) => setNameUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Штрих-код">
            <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Бренд">
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <Section title="Заголовки карточки (Uzum)">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Title (RU)" hint="Основной заголовок карточки на русском">
            <input type="text" value={titleRu} onChange={(e) => setTitleRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Title (UZ)">
            <input type="text" value={titleUz} onChange={(e) => setTitleUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Короткое описание (RU)">
            <input type="text" value={shortDescRu} onChange={(e) => setShortDescRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Короткое описание (UZ)">
            <input type="text" value={shortDescUz} onChange={(e) => setShortDescUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Полное описание (RU)" span={2}>
            <textarea rows={4} value={descriptionRu} onChange={(e) => setDescriptionRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
          <FormField label="Полное описание (UZ)" span={2}>
            <textarea rows={4} value={descriptionUz} onChange={(e) => setDescriptionUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <Section title="Налог и габариты (ВГХ)">
        <div className="grid grid-cols-5 gap-4">
          <FormField label="НДС %">
            <select value={vatPct} onChange={(e) => setVatPct(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle}>
              <option value="">—</option>
              {VAT_OPTIONS.map((v) => <option key={v} value={v}>{v}%</option>)}
            </select>
          </FormField>
          <FormField label="Вес, кг">
            <input type="number" step="0.001" value={weightKg}
              onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Длина, см">
            <input type="number" step="0.1" value={dimLength}
              onChange={(e) => setDimLength(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Ширина, см">
            <input type="number" step="0.1" value={dimWidth}
              onChange={(e) => setDimWidth(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Высота, см">
            <input type="number" step="0.1" value={dimHeight}
              onChange={(e) => setDimHeight(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <SaveRow pending={pending} error={error} saved={saved} />
    </form>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="p-5 rounded-lg"
      style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
    >
      <h3 className="text-xs uppercase tracking-wider font-medium mb-4"
        style={{ color: 'hsl(215 20% 55%)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export function SaveRow({
  pending, error, saved,
}: { pending: boolean; error: string | null; saved: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3">
      {error && (
        <span className="text-xs" style={{ color: '#f87171' }}>{error}</span>
      )}
      {saved && (
        <span className="text-xs" style={{ color: '#22c55e' }}>Сохранено ✓</span>
      )}
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
        style={{ backgroundColor: '#f59e0b', color: 'hsl(222 47% 11%)' }}
      >
        {pending ? 'Сохранение…' : 'Сохранить'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual test**

Run: `npm run dev`. Open `/products/1`. On the Карточка tab, edit Title RU, click Save.
Expected: "Сохранено ✓" appears briefly, score badge updates if Title RU was previously empty.

- [ ] **Step 4: Commit**

```bash
git add components/product/tabs/CardInfoTab.tsx
git commit -m "feat(editor): implement CardInfo tab"
```

---

## Task 7: PropertiesTab

**Files:**
- Modify (replace placeholder): `components/product/tabs/PropertiesTab.tsx`

The 4 fields:
- `propertiesRu` / `propertiesUz`: JSON `string[]` → rendered as textarea, one item per line.
- `characteristics`, `filterProperties`: JSON `{name_ru, name_uz, value_ru, value_uz}[]` → dynamic row editor.

- [ ] **Step 1: Implement**

Replace `components/product/tabs/PropertiesTab.tsx`:

```typescript
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { FormField, inputStyle } from '@/components/product/FormField';
import { Section, SaveRow } from './CardInfoTab';
import { updateProperties } from '@/app/actions/products';
import type { ProductCard } from '@/db/schema';

type KV = { name_ru: string; name_uz: string; value_ru: string; value_uz: string };

function parseStringArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
}

function parseKVArray(json: string | null | undefined): KV[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.map((x) => ({
      name_ru: String(x?.name_ru ?? ''),
      name_uz: String(x?.name_uz ?? ''),
      value_ru: String(x?.value_ru ?? ''),
      value_uz: String(x?.value_uz ?? ''),
    })) : [];
  } catch { return []; }
}

export function PropertiesTab({ productId, card }: { productId: number; card: ProductCard | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [propsRu, setPropsRu] = useState(parseStringArray(card?.propertiesRu).join('\n'));
  const [propsUz, setPropsUz] = useState(parseStringArray(card?.propertiesUz).join('\n'));
  const [characteristics, setCharacteristics] = useState<KV[]>(parseKVArray(card?.characteristics));
  const [filterProps, setFilterProps] = useState<KV[]>(parseKVArray(card?.filterProperties));

  useEffect(() => {
    setPropsRu(parseStringArray(card?.propertiesRu).join('\n'));
    setPropsUz(parseStringArray(card?.propertiesUz).join('\n'));
    setCharacteristics(parseKVArray(card?.characteristics));
    setFilterProps(parseKVArray(card?.filterProperties));
  }, [card]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const toArr = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
    startTransition(async () => {
      const r = await updateProperties(productId, {
        propertiesRu: JSON.stringify(toArr(propsRu)),
        propertiesUz: JSON.stringify(toArr(propsUz)),
        characteristics: JSON.stringify(characteristics.filter((k) => k.name_ru || k.value_ru)),
        filterProperties: JSON.stringify(filterProps.filter((k) => k.name_ru || k.value_ru)),
      });
      if ('error' in r) { setError(r.error); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Свойства (по одному на строку)">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Свойства (RU)" hint={`${propsRu.split('\n').filter(Boolean).length} шт`}>
            <textarea rows={6} value={propsRu} onChange={(e) => setPropsRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono resize-y"
              style={inputStyle} placeholder="Материал: резина&#10;Цвет: чёрный&#10;..." />
          </FormField>
          <FormField label="Свойства (UZ)" hint={`${propsUz.split('\n').filter(Boolean).length} шт`}>
            <textarea rows={6} value={propsUz} onChange={(e) => setPropsUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono resize-y"
              style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <KVSection
        title="Характеристики (для карточки)"
        rows={characteristics}
        onChange={setCharacteristics}
      />
      <KVSection
        title="Фильтрационные свойства (Uzum filter tree)"
        rows={filterProps}
        onChange={setFilterProps}
      />

      <SaveRow pending={pending} error={error} saved={saved} />
    </form>
  );
}

function KVSection({
  title, rows, onChange,
}: {
  title: string;
  rows: KV[];
  onChange: (next: KV[]) => void;
}) {
  function update(i: number, field: keyof KV, v: string) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: v } : r)));
  }
  function add() {
    onChange([...rows, { name_ru: '', name_uz: '', value_ru: '', value_uz: '' }]);
  }
  function remove(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }
  return (
    <Section title={title}>
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_32px] gap-2 text-xs px-1"
          style={{ color: 'hsl(215 20% 55%)' }}>
          <span>Имя (RU)</span><span>Имя (UZ)</span><span>Значение (RU)</span><span>Значение (UZ)</span><span />
        </div>
        {rows.length === 0 && (
          <div className="text-xs px-1 py-2" style={{ color: 'hsl(215 20% 45%)' }}>
            Нет записей
          </div>
        )}
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_32px] gap-2">
            <input type="text" value={r.name_ru} onChange={(e) => update(i, 'name_ru', e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded-md outline-none" style={inputStyle} />
            <input type="text" value={r.name_uz} onChange={(e) => update(i, 'name_uz', e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded-md outline-none" style={inputStyle} />
            <input type="text" value={r.value_ru} onChange={(e) => update(i, 'value_ru', e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded-md outline-none" style={inputStyle} />
            <input type="text" value={r.value_uz} onChange={(e) => update(i, 'value_uz', e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded-md outline-none" style={inputStyle} />
            <button type="button" onClick={() => remove(i)}
              className="flex items-center justify-center rounded-md transition-colors"
              style={{ border: '1px solid hsl(216 34% 28%)', color: '#ef4444' }}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button type="button" onClick={add}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md mt-2"
          style={{
            backgroundColor: 'hsl(222 47% 11%)',
            border: '1px dashed hsl(216 34% 28%)',
            color: 'hsl(215 20% 65%)',
          }}>
          <Plus size={12} /> Добавить запись
        </button>
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Typecheck + manual test**

Run: `npx tsc --noEmit`
Expected: no errors.

Run dev, open `/products/1`, Свойства tab. Add a filter property row, type values, Save.
Expected: "Сохранено ✓", score recomputes (Filter properties field turns green if it was empty before).

- [ ] **Step 3: Commit**

```bash
git add components/product/tabs/PropertiesTab.tsx
git commit -m "feat(editor): implement Properties tab with array + K/V editors"
```

---

## Task 8: MediaTab (display compliance + add by URL + delete + set primary)

**Files:**
- Modify (replace placeholder): `components/product/tabs/MediaTab.tsx`

- [ ] **Step 1: Implement**

Replace `components/product/tabs/MediaTab.tsx`:

```typescript
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Star, StarOff, Check, X } from 'lucide-react';
import { Section, SaveRow } from './CardInfoTab';
import { FormField, inputStyle } from '@/components/product/FormField';
import { addMedia, deleteMedia, setPrimaryMedia } from '@/app/actions/products';
import {
  PHOTO_MIN_WIDTH_PX, PHOTO_MIN_HEIGHT_PX, PHOTO_MAX_SIZE_BYTES, VIDEO_MAX_SIZE_BYTES,
} from '@/lib/constants';
import type { ProductMedia } from '@/db/schema';

export function MediaTab({ productId, media }: { productId: number; media: ProductMedia[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [url, setUrl] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [widthPx, setWidthPx] = useState<number | ''>('');
  const [heightPx, setHeightPx] = useState<number | ''>('');
  const [sizeBytes, setSizeBytes] = useState<number | ''>('');
  const [isPrimary, setIsPrimary] = useState(false);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    startTransition(async () => {
      const r = await addMedia(productId, {
        url: url.trim(),
        mediaType,
        widthPx: widthPx === '' ? null : Number(widthPx),
        heightPx: heightPx === '' ? null : Number(heightPx),
        sizeBytes: sizeBytes === '' ? null : Number(sizeBytes),
        isPrimary,
      });
      if ('error' in r) { setError(r.error); return; }
      setUrl(''); setWidthPx(''); setHeightPx(''); setSizeBytes(''); setIsPrimary(false);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleDelete(mediaId: number) {
    startTransition(async () => {
      const r = await deleteMedia(mediaId, productId);
      if ('error' in r) setError(r.error);
      else router.refresh();
    });
  }

  function handleSetPrimary(mediaId: number) {
    startTransition(async () => {
      const r = await setPrimaryMedia(mediaId, productId);
      if ('error' in r) setError(r.error);
      else router.refresh();
    });
  }

  const photos = media.filter((m) => m.mediaType === 'photo');
  const videos = media.filter((m) => m.mediaType === 'video');

  return (
    <div className="space-y-6">
      <Section title={`Фото (${photos.length})`}>
        <div className="text-xs mb-3" style={{ color: 'hsl(215 20% 55%)' }}>
          Требования §12.3 Uzum: ≥{PHOTO_MIN_WIDTH_PX}×{PHOTO_MIN_HEIGHT_PX}px, 3:4, ≤
          {Math.round(PHOTO_MAX_SIZE_BYTES / 1024 / 1024)}MB
        </div>
        {photos.length === 0 && <EmptyRow label="Нет фото" />}
        <div className="space-y-2">
          {photos.map((m) => (
            <MediaRow key={m.id} m={m} onDelete={handleDelete} onSetPrimary={handleSetPrimary} />
          ))}
        </div>
      </Section>

      <Section title={`Видео (${videos.length})`}>
        <div className="text-xs mb-3" style={{ color: 'hsl(215 20% 55%)' }}>
          Максимальный размер: {Math.round(VIDEO_MAX_SIZE_BYTES / 1024 / 1024)}MB
        </div>
        {videos.length === 0 && <EmptyRow label="Нет видео" />}
        <div className="space-y-2">
          {videos.map((m) => (
            <MediaRow key={m.id} m={m} onDelete={handleDelete} onSetPrimary={handleSetPrimary} />
          ))}
        </div>
      </Section>

      <form onSubmit={handleAdd}>
        <Section title="Добавить медиа">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="URL *" span={2}>
              <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
            </FormField>
            <FormField label="Тип">
              <select value={mediaType} onChange={(e) => setMediaType(e.target.value as 'photo' | 'video')}
                className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle}>
                <option value="photo">Фото</option>
                <option value="video">Видео</option>
              </select>
            </FormField>
            <FormField label="Сделать главным">
              <label className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer"
                style={inputStyle}>
                <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
                <span className="text-xs">Основной кадр</span>
              </label>
            </FormField>
            <FormField label="Ширина, px">
              <input type="number" value={widthPx}
                onChange={(e) => setWidthPx(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
            </FormField>
            <FormField label="Высота, px">
              <input type="number" value={heightPx}
                onChange={(e) => setHeightPx(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
            </FormField>
            <FormField label="Размер, байты" span={2}>
              <input type="number" value={sizeBytes}
                onChange={(e) => setSizeBytes(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
            </FormField>
          </div>
        </Section>
        <div className="mt-4"><SaveRow pending={pending} error={error} saved={saved} /></div>
      </form>
    </div>
  );
}

function MediaRow({
  m, onDelete, onSetPrimary,
}: {
  m: ProductMedia;
  onDelete: (id: number) => void;
  onSetPrimary: (id: number) => void;
}) {
  const sizeMb = m.sizeBytes ? (m.sizeBytes / 1024 / 1024).toFixed(2) : '—';
  const dims = m.widthPx && m.heightPx ? `${m.widthPx}×${m.heightPx}` : '—';
  return (
    <div
      className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 p-3 rounded-md"
      style={{ backgroundColor: 'hsl(222 47% 11%)', border: '1px solid hsl(216 34% 22%)' }}
    >
      {m.isCompliant === null ? (
        <span className="font-mono text-xs" style={{ color: 'hsl(215 20% 45%)' }}>—</span>
      ) : m.isCompliant ? (
        <Check size={14} style={{ color: '#22c55e' }} />
      ) : (
        <X size={14} style={{ color: '#ef4444' }} />
      )}
      <div className="min-w-0">
        <div className="text-xs font-mono truncate" style={{ color: 'hsl(213 31% 85%)' }}>
          {m.url}
        </div>
        {m.complianceNotes && (
          <div className="text-[10px] mt-0.5" style={{ color: '#f87171' }}>
            {m.complianceNotes}
          </div>
        )}
      </div>
      <span className="font-mono text-xs" style={{ color: 'hsl(215 20% 55%)' }}>{dims}</span>
      <span className="font-mono text-xs" style={{ color: 'hsl(215 20% 55%)' }}>{sizeMb} MB</span>
      <button type="button" onClick={() => onSetPrimary(m.id)}
        title={m.isPrimary ? 'Главный' : 'Сделать главным'}
        style={{ color: m.isPrimary ? '#f59e0b' : 'hsl(215 20% 45%)' }}>
        {m.isPrimary ? <Star size={14} /> : <StarOff size={14} />}
      </button>
      <button type="button" onClick={() => onDelete(m.id)} style={{ color: '#ef4444' }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="text-xs px-1 py-2" style={{ color: 'hsl(215 20% 45%)' }}>{label}</div>
  );
}
```

- [ ] **Step 2: Typecheck + manual test**

Run: `npx tsc --noEmit`
Expected: no errors.

Run dev, open `/products/1`, Медиа tab. Add a photo URL `https://example.com/test.jpg` with width=1080, height=1440, size=500000, submit.
Expected: new row appears with ✓ compliance. Click trash → row disappears.

- [ ] **Step 3: Commit**

```bash
git add components/product/tabs/MediaTab.tsx
git commit -m "feat(editor): implement Media tab with compliance display + add/delete/primary"
```

---

## Task 9: AccessoriesTab + PartsTab

**Files:**
- Modify (replace placeholder): `components/product/tabs/AccessoriesTab.tsx`
- Modify (replace placeholder): `components/product/tabs/PartsTab.tsx`

- [ ] **Step 1: Implement AccessoriesTab**

Replace `components/product/tabs/AccessoriesTab.tsx`:

```typescript
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField, inputStyle } from '@/components/product/FormField';
import { Section, SaveRow } from './CardInfoTab';
import { updateAccessoriesData } from '@/app/actions/products';
import type { AccessoriesData } from '@/db/schema';

type Props = { productId: number; data: AccessoriesData | null };

function parseColors(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
}

function parseBundleInfo(json: string | null | undefined) {
  if (!json) return { description_ru: '', description_uz: '', items: [] as string[] };
  try {
    const p = JSON.parse(json);
    return {
      description_ru: String(p?.description_ru ?? ''),
      description_uz: String(p?.description_uz ?? ''),
      items: Array.isArray(p?.items) ? p.items.filter((x: unknown) => typeof x === 'string') : [],
    };
  } catch { return { description_ru: '', description_uz: '', items: [] }; }
}

export function AccessoriesTab({ productId, data }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [universalFit, setUniversalFit] = useState(Boolean(data?.universalFit));
  const [useCaseRu, setUseCaseRu] = useState(data?.useCaseRu ?? '');
  const [useCaseUz, setUseCaseUz] = useState(data?.useCaseUz ?? '');
  const [materialRu, setMaterialRu] = useState(data?.materialRu ?? '');
  const [materialUz, setMaterialUz] = useState(data?.materialUz ?? '');
  const [colors, setColors] = useState(parseColors(data?.colorOptions).join('\n'));
  const [volumeMl, setVolumeMl] = useState<number | ''>(data?.volumeMl ?? '');
  const [applicationMethodRu, setApplicationMethodRu] = useState(data?.applicationMethodRu ?? '');
  const [applicationMethodUz, setApplicationMethodUz] = useState(data?.applicationMethodUz ?? '');
  const [kitContentsRu, setKitContentsRu] = useState(data?.kitContentsRu ?? '');
  const [kitContentsUz, setKitContentsUz] = useState(data?.kitContentsUz ?? '');
  const initialBundle = parseBundleInfo(data?.bundleInfo);
  const [bundleDescRu, setBundleDescRu] = useState(initialBundle.description_ru);
  const [bundleDescUz, setBundleDescUz] = useState(initialBundle.description_uz);
  const [bundleItems, setBundleItems] = useState(initialBundle.items.join('\n'));

  useEffect(() => {
    setUniversalFit(Boolean(data?.universalFit));
    setUseCaseRu(data?.useCaseRu ?? '');
    setUseCaseUz(data?.useCaseUz ?? '');
    setMaterialRu(data?.materialRu ?? '');
    setMaterialUz(data?.materialUz ?? '');
    setColors(parseColors(data?.colorOptions).join('\n'));
    setVolumeMl(data?.volumeMl ?? '');
    setApplicationMethodRu(data?.applicationMethodRu ?? '');
    setApplicationMethodUz(data?.applicationMethodUz ?? '');
    setKitContentsRu(data?.kitContentsRu ?? '');
    setKitContentsUz(data?.kitContentsUz ?? '');
    const b = parseBundleInfo(data?.bundleInfo);
    setBundleDescRu(b.description_ru);
    setBundleDescUz(b.description_uz);
    setBundleItems(b.items.join('\n'));
  }, [data]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    const colorArr = colors.split('\n').map((x) => x.trim()).filter(Boolean);
    const itemsArr = bundleItems.split('\n').map((x) => x.trim()).filter(Boolean);
    const bundleInfo = bundleDescRu || bundleDescUz || itemsArr.length
      ? JSON.stringify({ description_ru: bundleDescRu, description_uz: bundleDescUz, items: itemsArr })
      : null;
    startTransition(async () => {
      const r = await updateAccessoriesData(productId, {
        universalFit,
        useCaseRu: useCaseRu.trim() || null,
        useCaseUz: useCaseUz.trim() || null,
        materialRu: materialRu.trim() || null,
        materialUz: materialUz.trim() || null,
        colorOptions: colorArr.length ? JSON.stringify(colorArr) : null,
        volumeMl: volumeMl === '' ? null : Number(volumeMl),
        applicationMethodRu: applicationMethodRu.trim() || null,
        applicationMethodUz: applicationMethodUz.trim() || null,
        kitContentsRu: kitContentsRu.trim() || null,
        kitContentsUz: kitContentsUz.trim() || null,
        bundleInfo,
      });
      if ('error' in r) { setError(r.error); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Сценарий использования">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Use case (RU)" hint="Weight 6 — важное поле для score">
            <textarea rows={3} value={useCaseRu} onChange={(e) => setUseCaseRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
          <FormField label="Use case (UZ)">
            <textarea rows={3} value={useCaseUz} onChange={(e) => setUseCaseUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
          <FormField label="Способ применения (RU)">
            <textarea rows={2} value={applicationMethodRu}
              onChange={(e) => setApplicationMethodRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
          <FormField label="Способ применения (UZ)">
            <textarea rows={2} value={applicationMethodUz}
              onChange={(e) => setApplicationMethodUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <Section title="Материал, цвет, объём">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Материал (RU)">
            <input type="text" value={materialRu} onChange={(e) => setMaterialRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Материал (UZ)">
            <input type="text" value={materialUz} onChange={(e) => setMaterialUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Объём, мл">
            <input type="number" step="0.1" value={volumeMl}
              onChange={(e) => setVolumeMl(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Цвета (по одному на строку)" span={2}>
            <textarea rows={3} value={colors} onChange={(e) => setColors(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle}
              placeholder="Чёрный&#10;Серый&#10;Бежевый" />
          </FormField>
          <FormField label="Универсальная посадка">
            <label className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer"
              style={inputStyle}>
              <input type="checkbox" checked={universalFit}
                onChange={(e) => setUniversalFit(e.target.checked)} />
              <span className="text-xs">Подходит ко всем авто</span>
            </label>
          </FormField>
        </div>
      </Section>

      <Section title="Комплект поставки">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Состав комплекта (RU)">
            <textarea rows={2} value={kitContentsRu} onChange={(e) => setKitContentsRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
          <FormField label="Состав комплекта (UZ)">
            <textarea rows={2} value={kitContentsUz} onChange={(e) => setKitContentsUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
          <FormField label="Bundle описание (RU)" hint="Weight 4 — если применимо">
            <input type="text" value={bundleDescRu} onChange={(e) => setBundleDescRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Bundle описание (UZ)">
            <input type="text" value={bundleDescUz} onChange={(e) => setBundleDescUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Bundle позиции (по одной на строку)" span={2}>
            <textarea rows={3} value={bundleItems} onChange={(e) => setBundleItems(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y font-mono" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <SaveRow pending={pending} error={error} saved={saved} />
    </form>
  );
}
```

- [ ] **Step 2: Implement PartsTab**

Replace `components/product/tabs/PartsTab.tsx`:

```typescript
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { FormField, inputStyle } from '@/components/product/FormField';
import { Section, SaveRow } from './CardInfoTab';
import { updatePartsData } from '@/app/actions/products';
import type { PartsData } from '@/db/schema';

type CompatibleModel = { make: string; model: string; year_from: number | ''; year_to: number | ''; engine: string };

function parseStringArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
}

function parseCompatible(json: string | null | undefined): CompatibleModel[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.map((x) => ({
      make: String(x?.make ?? ''),
      model: String(x?.model ?? ''),
      year_from: typeof x?.year_from === 'number' ? x.year_from : '',
      year_to: typeof x?.year_to === 'number' ? x.year_to : '',
      engine: String(x?.engine ?? ''),
    })) : [];
  } catch { return []; }
}

export function PartsTab({ productId, data }: { productId: number; data: PartsData | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [oemNumber, setOemNumber] = useState(data?.oemNumber ?? '');
  const [crossRefs, setCrossRefs] = useState(parseStringArray(data?.crossReferences).join('\n'));
  const [compatible, setCompatible] = useState<CompatibleModel[]>(parseCompatible(data?.compatibleModels));
  const [positionRu, setPositionRu] = useState(data?.positionRu ?? '');
  const [positionUz, setPositionUz] = useState(data?.positionUz ?? '');
  const [partLengthMm, setPartLengthMm] = useState<number | ''>(data?.partLengthMm ?? '');
  const [partWidthMm, setPartWidthMm] = useState<number | ''>(data?.partWidthMm ?? '');
  const [partHeightMm, setPartHeightMm] = useState<number | ''>(data?.partHeightMm ?? '');
  const [partWeightG, setPartWeightG] = useState<number | ''>(data?.partWeightG ?? '');
  const [warrantyMonths, setWarrantyMonths] = useState<number | ''>(data?.warrantyMonths ?? '');
  const [materialSpec, setMaterialSpec] = useState(data?.materialSpec ?? '');

  useEffect(() => {
    setOemNumber(data?.oemNumber ?? '');
    setCrossRefs(parseStringArray(data?.crossReferences).join('\n'));
    setCompatible(parseCompatible(data?.compatibleModels));
    setPositionRu(data?.positionRu ?? '');
    setPositionUz(data?.positionUz ?? '');
    setPartLengthMm(data?.partLengthMm ?? '');
    setPartWidthMm(data?.partWidthMm ?? '');
    setPartHeightMm(data?.partHeightMm ?? '');
    setPartWeightG(data?.partWeightG ?? '');
    setWarrantyMonths(data?.warrantyMonths ?? '');
    setMaterialSpec(data?.materialSpec ?? '');
  }, [data]);

  function updateCompat(i: number, field: keyof CompatibleModel, v: string | number) {
    setCompatible((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: v } : m)));
  }
  function addCompat() {
    setCompatible((prev) => [...prev, { make: '', model: '', year_from: '', year_to: '', engine: '' }]);
  }
  function removeCompat(i: number) {
    setCompatible((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    const crossArr = crossRefs.split('\n').map((x) => x.trim()).filter(Boolean);
    const compatClean = compatible
      .filter((m) => m.make || m.model)
      .map((m) => ({
        make: m.make.trim(),
        model: m.model.trim(),
        year_from: m.year_from === '' ? null : Number(m.year_from),
        year_to: m.year_to === '' ? null : Number(m.year_to),
        engine: m.engine.trim(),
      }));
    startTransition(async () => {
      const r = await updatePartsData(productId, {
        oemNumber: oemNumber.trim() || null,
        crossReferences: crossArr.length ? JSON.stringify(crossArr) : null,
        compatibleModels: compatClean.length ? JSON.stringify(compatClean) : null,
        positionRu: positionRu.trim() || null,
        positionUz: positionUz.trim() || null,
        partLengthMm: partLengthMm === '' ? null : Number(partLengthMm),
        partWidthMm: partWidthMm === '' ? null : Number(partWidthMm),
        partHeightMm: partHeightMm === '' ? null : Number(partHeightMm),
        partWeightG: partWeightG === '' ? null : Number(partWeightG),
        warrantyMonths: warrantyMonths === '' ? null : Number(warrantyMonths),
        materialSpec: materialSpec.trim() || null,
      });
      if ('error' in r) { setError(r.error); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="OEM и кросс-референс">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="OEM номер *" hint="Weight 10 — критически важно">
            <input type="text" value={oemNumber} onChange={(e) => setOemNumber(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Кросс-номера (по одному на строку)">
            <textarea rows={3} value={crossRefs} onChange={(e) => setCrossRefs(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y font-mono" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <Section title={`Совместимые модели (${compatible.length}) — Weight 12`}>
        <div className="space-y-2">
          <div className="grid grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_1.2fr_32px] gap-2 text-xs px-1"
            style={{ color: 'hsl(215 20% 55%)' }}>
            <span>Марка</span><span>Модель</span><span>Год от</span><span>Год до</span><span>Двигатель</span><span />
          </div>
          {compatible.length === 0 && (
            <div className="text-xs px-1 py-2" style={{ color: 'hsl(215 20% 45%)' }}>Нет записей</div>
          )}
          {compatible.map((m, i) => (
            <div key={i} className="grid grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_1.2fr_32px] gap-2">
              <input type="text" value={m.make} onChange={(e) => updateCompat(i, 'make', e.target.value)}
                className="w-full text-xs px-2 py-1.5 rounded-md outline-none" style={inputStyle} />
              <input type="text" value={m.model} onChange={(e) => updateCompat(i, 'model', e.target.value)}
                className="w-full text-xs px-2 py-1.5 rounded-md outline-none" style={inputStyle} />
              <input type="number" value={m.year_from}
                onChange={(e) => updateCompat(i, 'year_from', e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs px-2 py-1.5 rounded-md outline-none font-mono" style={inputStyle} />
              <input type="number" value={m.year_to}
                onChange={(e) => updateCompat(i, 'year_to', e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs px-2 py-1.5 rounded-md outline-none font-mono" style={inputStyle} />
              <input type="text" value={m.engine} onChange={(e) => updateCompat(i, 'engine', e.target.value)}
                className="w-full text-xs px-2 py-1.5 rounded-md outline-none font-mono" style={inputStyle} />
              <button type="button" onClick={() => removeCompat(i)}
                className="flex items-center justify-center rounded-md"
                style={{ border: '1px solid hsl(216 34% 28%)', color: '#ef4444' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button type="button" onClick={addCompat}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md mt-2"
            style={{
              backgroundColor: 'hsl(222 47% 11%)',
              border: '1px dashed hsl(216 34% 28%)',
              color: 'hsl(215 20% 65%)',
            }}>
            <Plus size={12} /> Добавить модель
          </button>
        </div>
      </Section>

      <Section title="Фитмент и характеристики">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Позиция установки (RU)">
            <input type="text" value={positionRu} onChange={(e) => setPositionRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle}
              placeholder="Передний левый / Задний / ..." />
          </FormField>
          <FormField label="Позиция установки (UZ)">
            <input type="text" value={positionUz} onChange={(e) => setPositionUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Материал / спецификация" span={2}>
            <input type="text" value={materialSpec} onChange={(e) => setMaterialSpec(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Гарантия, мес.">
            <input type="number" value={warrantyMonths}
              onChange={(e) => setWarrantyMonths(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Вес детали, г">
            <input type="number" step="0.1" value={partWeightG}
              onChange={(e) => setPartWeightG(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Длина детали, мм">
            <input type="number" step="0.1" value={partLengthMm}
              onChange={(e) => setPartLengthMm(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Ширина детали, мм">
            <input type="number" step="0.1" value={partWidthMm}
              onChange={(e) => setPartWidthMm(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Высота детали, мм">
            <input type="number" step="0.1" value={partHeightMm}
              onChange={(e) => setPartHeightMm(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <SaveRow pending={pending} error={error} saved={saved} />
    </form>
  );
}
```

- [ ] **Step 3: Typecheck + manual test**

Run: `npx tsc --noEmit`
Expected: no errors.

Run dev:
- Open `/products/1` (accessories), Профиль tab → AccessoriesTab renders. Edit Use case (RU), Save.
- Open `/products/6` (PRT-001, parts), Профиль tab → PartsTab renders. Add a compatible model row, Save.
Both should show "Сохранено ✓" and score should recompute.

- [ ] **Step 4: Commit**

```bash
git add components/product/tabs/AccessoriesTab.tsx components/product/tabs/PartsTab.tsx
git commit -m "feat(editor): implement profile tabs (Accessories + Parts)"
```

---

## Task 10: PricingTab

**Files:**
- Modify (replace placeholder): `components/product/tabs/PricingTab.tsx`

- [ ] **Step 1: Implement**

Replace `components/product/tabs/PricingTab.tsx`:

```typescript
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField, inputStyle } from '@/components/product/FormField';
import { Section, SaveRow } from './CardInfoTab';
import { updatePricing } from '@/app/actions/products';
import type { Pricing } from '@/db/schema';

export function PricingTab({ productId, pricing }: { productId: number; pricing: Pricing | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [cost, setCost] = useState<number | ''>(pricing?.costPrice ?? '');
  const [selling, setSelling] = useState<number | ''>(pricing?.sellingPrice ?? '');
  const [discount, setDiscount] = useState<number | ''>(pricing?.discountPrice ?? '');
  const [competitor, setCompetitor] = useState<number | ''>(pricing?.competitorPrice ?? '');
  const [competitorUrl, setCompetitorUrl] = useState(pricing?.competitorUrl ?? '');

  useEffect(() => {
    setCost(pricing?.costPrice ?? '');
    setSelling(pricing?.sellingPrice ?? '');
    setDiscount(pricing?.discountPrice ?? '');
    setCompetitor(pricing?.competitorPrice ?? '');
    setCompetitorUrl(pricing?.competitorUrl ?? '');
  }, [pricing]);

  // Derived margin preview (saved value comes from server on refresh)
  const marginPreview = cost !== '' && selling !== '' && Number(cost) > 0
    ? (((Number(selling) - Number(cost)) / Number(cost)) * 100).toFixed(1)
    : null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    const costN = cost === '' ? null : Number(cost);
    const sellN = selling === '' ? null : Number(selling);
    const margin = costN != null && sellN != null && costN > 0
      ? ((sellN - costN) / costN) * 100
      : null;
    startTransition(async () => {
      const r = await updatePricing(productId, {
        costPrice: costN,
        sellingPrice: sellN,
        discountPrice: discount === '' ? null : Number(discount),
        marginPct: margin,
        competitorPrice: competitor === '' ? null : Number(competitor),
        competitorUrl: competitorUrl.trim() || null,
      });
      if ('error' in r) { setError(r.error); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Цены">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Себестоимость, сум">
            <input type="number" step="1" value={cost}
              onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Цена продажи, сум *">
            <input type="number" step="1" value={selling}
              onChange={(e) => setSelling(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Цена со скидкой, сум">
            <input type="number" step="1" value={discount}
              onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Наценка (расчётная)" hint="Пересчитывается автоматически по цене и себестоимости">
            <div className="w-full text-sm px-3 py-2 rounded-md font-mono"
              style={{ ...inputStyle, color: marginPreview ? '#22c55e' : 'hsl(215 20% 45%)' }}>
              {marginPreview != null ? `${marginPreview}%` : '—'}
            </div>
          </FormField>
        </div>
      </Section>

      <Section title="Конкурент">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Цена конкурента, сум">
            <input type="number" step="1" value={competitor}
              onChange={(e) => setCompetitor(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="URL страницы конкурента" span={2}>
            <input type="url" value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <SaveRow pending={pending} error={error} saved={saved} />
    </form>
  );
}
```

- [ ] **Step 2: Typecheck + manual test**

Run: `npx tsc --noEmit`
Expected: no errors.

Run dev, open `/products/3` (ACC-003, draft w/o price). Цены tab → enter cost=100 selling=150, Save.
Expected: margin shows "50.0%", list page shows updated price.

- [ ] **Step 3: Commit**

```bash
git add components/product/tabs/PricingTab.tsx
git commit -m "feat(editor): implement Pricing tab with auto-margin calc"
```

---

## Task 11: FulfillmentTab

**Files:**
- Modify (replace placeholder): `components/product/tabs/FulfillmentTab.tsx`

- [ ] **Step 1: Implement**

Replace `components/product/tabs/FulfillmentTab.tsx`:

```typescript
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField, inputStyle } from '@/components/product/FormField';
import { Section, SaveRow } from './CardInfoTab';
import { updateFulfillment } from '@/app/actions/products';
import { FULFILLMENT_SCHEMES, FBO_TURNOVER_WARN_DAYS, FBO_TURNOVER_CRITICAL_DAYS, FBO_FREE_WINDOW_DAYS } from '@/lib/constants';
import type { Fulfillment } from '@/db/schema';

export function FulfillmentTab({
  productId, fulfillment,
}: { productId: number; fulfillment: Fulfillment | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [scheme, setScheme] = useState<Fulfillment['scheme']>(fulfillment?.scheme ?? 'FBS');
  const [stockQuantity, setStockQuantity] = useState<number | ''>(fulfillment?.stockQuantity ?? 0);
  const [fboTurnoverDays, setFboTurnoverDays] = useState<number | ''>(fulfillment?.fboTurnoverDays ?? '');
  const [isOversized, setIsOversized] = useState(Boolean(fulfillment?.isOversized));

  useEffect(() => {
    setScheme(fulfillment?.scheme ?? 'FBS');
    setStockQuantity(fulfillment?.stockQuantity ?? 0);
    setFboTurnoverDays(fulfillment?.fboTurnoverDays ?? '');
    setIsOversized(Boolean(fulfillment?.isOversized));
  }, [fulfillment]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    startTransition(async () => {
      const r = await updateFulfillment(productId, {
        scheme,
        stockQuantity: stockQuantity === '' ? 0 : Number(stockQuantity),
        fboTurnoverDays: fboTurnoverDays === '' ? null : Number(fboTurnoverDays),
        isOversized,
      });
      if ('error' in r) { setError(r.error); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const turnoverNum = fboTurnoverDays === '' ? null : Number(fboTurnoverDays);
  const turnoverLabel = turnoverNum == null ? null
    : turnoverNum >= FBO_TURNOVER_CRITICAL_DAYS
      ? { color: '#ef4444', text: `КРИТИЧНО — до платного хранения осталось ${FBO_FREE_WINDOW_DAYS - turnoverNum}д` }
      : turnoverNum >= FBO_TURNOVER_WARN_DAYS
        ? { color: '#f59e0b', text: `ВНИМАНИЕ — до платного хранения ${FBO_FREE_WINDOW_DAYS - turnoverNum}д` }
        : { color: '#22c55e', text: 'В норме' };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Схема и остаток">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Схема выполнения">
            <select value={scheme} onChange={(e) => setScheme(e.target.value as Fulfillment['scheme'])}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle}>
              {FULFILLMENT_SCHEMES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Остаток, шт">
            <input type="number" min="0" value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Крупногабаритный">
            <label className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer"
              style={inputStyle}>
              <input type="checkbox" checked={isOversized}
                onChange={(e) => setIsOversized(e.target.checked)} />
              <span className="text-xs">Oversized (КГТ)</span>
            </label>
          </FormField>
        </div>
      </Section>

      {scheme === 'FBO' && (
        <Section title="FBO оборачиваемость (§5.3)">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Дней на складе Uzum"
              hint={`Warn ≥${FBO_TURNOVER_WARN_DAYS}д · Critical ≥${FBO_TURNOVER_CRITICAL_DAYS}д · Бесплатный период ${FBO_FREE_WINDOW_DAYS}д`}>
              <input type="number" min="0" value={fboTurnoverDays}
                onChange={(e) => setFboTurnoverDays(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
            </FormField>
            <div>
              {turnoverLabel && (
                <div className="mt-6 text-sm font-medium" style={{ color: turnoverLabel.color }}>
                  {turnoverLabel.text}
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      <SaveRow pending={pending} error={error} saved={saved} />
    </form>
  );
}
```

- [ ] **Step 2: Typecheck + manual test**

Run: `npx tsc --noEmit`
Expected: no errors.

Run dev, open `/products/4` (ACC-004, FBO 48d). Логистика tab shows FBO section with amber warning.

- [ ] **Step 3: Commit**

```bash
git add components/product/tabs/FulfillmentTab.tsx
git commit -m "feat(editor): implement Fulfillment tab with FBO turnover warnings"
```

---

## Task 12: ModerationTab (includes Boost)

**Files:**
- Modify (replace placeholder): `components/product/tabs/ModerationTab.tsx`

- [ ] **Step 1: Implement**

Replace `components/product/tabs/ModerationTab.tsx`:

```typescript
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField, inputStyle } from '@/components/product/FormField';
import { Section, SaveRow } from './CardInfoTab';
import { updateModeration, updateBoost } from '@/app/actions/products';
import { MODERATION_STATUSES } from '@/lib/constants';
import type { Moderation, Boost } from '@/db/schema';

function parseStringArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
}

const statusLabels: Record<Moderation['status'], string> = {
  draft: 'Черновик',
  ready: 'Готов',
  on_sale: 'Продаётся',
  blocked: 'Заблокирован',
  archived: 'Архив',
};

export function ModerationTab({
  productId, moderation, boost,
}: { productId: number; moderation: Moderation | null; boost: Boost | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [status, setStatus] = useState<Moderation['status']>(moderation?.status ?? 'draft');
  const [blockReason, setBlockReason] = useState(moderation?.blockReason ?? '');

  const [campaignType, setCampaignType] = useState(boost?.campaignType ?? '');
  const [bidPer1000, setBidPer1000] = useState<number | ''>(boost?.bidPer1000 ?? '');
  const [dailyBudget, setDailyBudget] = useState<number | ''>(boost?.dailyBudget ?? '');
  const [totalBudget, setTotalBudget] = useState<number | ''>(boost?.totalBudget ?? '');
  const [keywords, setKeywords] = useState(parseStringArray(boost?.keywords).join('\n'));
  const [negativeKeywords, setNegativeKeywords] = useState(parseStringArray(boost?.negativeKeywords).join('\n'));
  const [drrPct, setDrrPct] = useState<number | ''>(boost?.drrPct ?? '');

  useEffect(() => {
    setStatus(moderation?.status ?? 'draft');
    setBlockReason(moderation?.blockReason ?? '');
  }, [moderation]);
  useEffect(() => {
    setCampaignType(boost?.campaignType ?? '');
    setBidPer1000(boost?.bidPer1000 ?? '');
    setDailyBudget(boost?.dailyBudget ?? '');
    setTotalBudget(boost?.totalBudget ?? '');
    setKeywords(parseStringArray(boost?.keywords).join('\n'));
    setNegativeKeywords(parseStringArray(boost?.negativeKeywords).join('\n'));
    setDrrPct(boost?.drrPct ?? '');
  }, [boost]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    const toArr = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
    startTransition(async () => {
      const r1 = await updateModeration(productId, {
        status,
        blockReason: blockReason.trim() || null,
      });
      if ('error' in r1) { setError(r1.error); return; }

      const kwArr = toArr(keywords);
      const negArr = toArr(negativeKeywords);
      const r2 = await updateBoost(productId, {
        campaignType: campaignType.trim() || null,
        bidPer1000: bidPer1000 === '' ? null : Number(bidPer1000),
        dailyBudget: dailyBudget === '' ? null : Number(dailyBudget),
        totalBudget: totalBudget === '' ? null : Number(totalBudget),
        keywords: kwArr.length ? JSON.stringify(kwArr) : null,
        negativeKeywords: negArr.length ? JSON.stringify(negArr) : null,
        drrPct: drrPct === '' ? null : Number(drrPct),
      });
      if ('error' in r2) { setError(r2.error); return; }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Модерация">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Статус">
            <select value={status} onChange={(e) => setStatus(e.target.value as Moderation['status'])}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle}>
              {MODERATION_STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Причина блокировки (если blocked)">
            <input type="text" value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <Section title="Boost (рекламная кампания)">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Тип кампании">
            <input type="text" value={campaignType} onChange={(e) => setCampaignType(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle}
              placeholder="Поиск / Каталог / Смежные" />
          </FormField>
          <FormField label="ДРР, %">
            <input type="number" step="0.1" value={drrPct}
              onChange={(e) => setDrrPct(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Ставка за 1000, сум">
            <input type="number" step="1" value={bidPer1000}
              onChange={(e) => setBidPer1000(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Дневной бюджет, сум">
            <input type="number" step="1" value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Общий бюджет, сум" span={2}>
            <input type="number" step="1" value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Ключевые слова (по одному на строку)">
            <textarea rows={4} value={keywords} onChange={(e) => setKeywords(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono resize-y" style={inputStyle} />
          </FormField>
          <FormField label="Минус-слова (по одному на строку)">
            <textarea rows={4} value={negativeKeywords} onChange={(e) => setNegativeKeywords(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono resize-y" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <SaveRow pending={pending} error={error} saved={saved} />
    </form>
  );
}
```

- [ ] **Step 2: Typecheck + manual test**

Run: `npx tsc --noEmit`
Expected: no errors.

Run dev, open `/products/3`, Модерация tab. Change status to "Готов", Save.
Expected: list page status badge updates.

- [ ] **Step 3: Commit**

```bash
git add components/product/tabs/ModerationTab.tsx
git commit -m "feat(editor): implement Moderation tab with Boost campaign fields"
```

---

## Task 13: PerformanceTab (read-only snapshot table)

**Files:**
- Modify (replace placeholder): `components/product/tabs/PerformanceTab.tsx`

- [ ] **Step 1: Implement**

Replace `components/product/tabs/PerformanceTab.tsx`:

```typescript
import { Section } from './CardInfoTab';
import type { Performance } from '@/db/schema';

export function PerformanceTab({ performance }: { performance: Performance[] }) {
  if (performance.length === 0) {
    return (
      <Section title="Метрики">
        <div className="text-sm py-6 text-center" style={{ color: 'hsl(215 20% 45%)' }}>
          Нет данных о показателях. Снэпшоты загружаются из Uzum API (ещё не реализовано).
        </div>
      </Section>
    );
  }

  const headers = [
    { key: 'date', label: 'Дата' },
    { key: 'impressions', label: 'Показы' },
    { key: 'opens', label: 'Открытия' },
    { key: 'cart', label: 'В корзину' },
    { key: 'orders', label: 'Заказы' },
    { key: 'received', label: 'Получено' },
    { key: 'returns', label: 'Возвраты' },
    { key: 'conversionPct', label: 'CR, %' },
    { key: 'revenue', label: 'Выручка' },
    { key: 'rating', label: 'Рейтинг' },
    { key: 'reviews', label: 'Отзывы' },
    { key: 'roiPct', label: 'ROI, %' },
  ] as const;

  return (
    <Section title={`Метрики (${performance.length} снэпшотов)`}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(216 34% 22%)' }}>
              {headers.map((h) => (
                <th key={h.key}
                  className="px-3 py-2 text-left font-medium whitespace-nowrap"
                  style={{ color: 'hsl(215 20% 55%)' }}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {performance.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid hsl(216 34% 19%)' }}>
                {headers.map((h) => {
                  const v = (row as unknown as Record<string, unknown>)[h.key];
                  const display = v == null ? '—' :
                    typeof v === 'number' ? (h.key === 'revenue' ? v.toLocaleString('ru-RU') : String(v)) :
                    String(v);
                  return (
                    <td key={h.key}
                      className="px-3 py-2 font-mono whitespace-nowrap"
                      style={{ color: 'hsl(213 31% 85%)' }}>
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Typecheck + manual test**

Run: `npx tsc --noEmit`
Expected: no errors.

Run dev, open any product, Метрики tab.
Expected: "Нет данных о показателях" (seed doesn't create performance rows). Table renders correctly when rows exist.

- [ ] **Step 3: Commit**

```bash
git add components/product/tabs/PerformanceTab.tsx
git commit -m "feat(editor): implement read-only Performance tab"
```

---

## Self-Review Checklist

After completing all tasks:

1. **Spec coverage:**
   - `/products/new` with profile selector → Task 4 ✓
   - `/products/[id]` with 8 tabs → Tasks 5–13 ✓
   - `/products/[id]/edit` redirect → Task 5 ✓
   - 8 tabs (Card, Properties, Media, Profile, Pricing, Fulfillment, Moderation, Performance) → Tasks 6–13 ✓
   - Dual-profile (AccessoriesTab vs PartsTab conditional) → Task 9 ✓
   - Score breakdown visible → Task 5 (ScoreBreakdownPanel) ✓
   - Server actions handle all updates → Task 2 ✓
   - Photo compliance computed on add → Task 2 (`addMedia` calls `checkPhotoCompliance`) ✓

2. **Placeholder scan:** None — every step has concrete code.

3. **Type consistency:**
   - `ActionResult` shape is `{ok: true} | {error: string} | { id: number } | { error: string }` — all action callers use `'error' in r` guard.
   - `FormField` / `inputStyle` / `Section` / `SaveRow` exported from their files and re-imported by tabs.
   - `ProductDetail` returned from `getProductById` is consumed exactly by `ProductEditor`.
   - `useEffect` re-syncs local state when props change (enables `router.refresh()` to propagate fresh server data).

4. **Integration check after all tasks:**
   Run: `npm test` → all tests pass. Run: `npx tsc --noEmit` → zero errors. Run: `npm run dev`, click through all tabs for an accessories product (ID 1) and a parts product (ID 6). Edit a field in each tab, save, verify score updates.

---

**Plan complete.** Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, two-stage review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using `executing-plans`, batch with checkpoints.

Which approach?
