# AAPA Tracker — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install all dependencies, define the 10-table Drizzle schema, build constants/validators/scoring engine, and seed sample data — so the app has a fully working data layer before any UI is built.

**Architecture:** SQLite via better-sqlite3 as a single-file database (`/data/aapa-tracker.db`). Drizzle ORM for type-safe queries and migrations. Pure-function scoring engine that computes scores on demand from product data snapshots. Vitest for unit tests on pure functions.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Drizzle ORM + drizzle-kit, better-sqlite3, Vitest, shadcn/ui (CLI init), Tailwind CSS, Recharts

---

## File Map

**Create:**
- `drizzle.config.ts` — Drizzle config pointing at SQLite file
- `db/schema.ts` — All 10 table definitions
- `db/index.ts` — DB singleton (better-sqlite3 + drizzle)
- `db/seed.ts` — 5 accessories + 2 parts sample rows
- `lib/constants.ts` — Uzum rules, enums, stop-word patterns
- `lib/validators.ts` — Stop-words, media compliance, bilingual check
- `lib/scoring.ts` — Dual-profile scoring engine (0-100)
- `lib/scoring.test.ts` — Vitest unit tests for scoring engine
- `lib/validators.test.ts` — Vitest unit tests for validators
- `vitest.config.ts` — Vitest config

**Modify:**
- `package.json` — add all dependencies
- `tsconfig.json` — add path aliases
- `tailwind.config.ts` — add custom color tokens
- `app/globals.css` — add CSS variables for theme
- `app/layout.tsx` — update metadata and font

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
cd /Users/anvar/Documents/GitHub/aapa-tracker
npm install drizzle-orm better-sqlite3 recharts class-variance-authority clsx tailwind-merge lucide-react @radix-ui/react-slot
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D drizzle-kit @types/better-sqlite3 vitest @vitejs/plugin-react
```

- [ ] **Step 3: Verify installs**

```bash
node -e "require('better-sqlite3'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install drizzle, better-sqlite3, shadcn deps, vitest"
```

---

## Task 2: Configure Drizzle + Vitest

**Files:**
- Create: `drizzle.config.ts`
- Create: `vitest.config.ts`
- Modify: `tsconfig.json`

- [ ] **Step 1: Create drizzle.config.ts**

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/aapa-tracker.db',
  },
} satisfies Config;
```

- [ ] **Step 2: Create vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 3: Add path alias to tsconfig.json**

In `tsconfig.json`, add inside `"compilerOptions"`:
```json
"paths": {
  "@/*": ["./*"]
}
```

- [ ] **Step 4: Add scripts to package.json**

Add inside `"scripts"`:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "npx tsx db/migrate.ts",
"db:seed": "npx tsx db/seed.ts",
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Create data directory**

```bash
mkdir -p data
echo "data/*.db" >> .gitignore
echo "data/*.db-shm" >> .gitignore
echo "data/*.db-wal" >> .gitignore
```

- [ ] **Step 6: Commit**

```bash
git add drizzle.config.ts vitest.config.ts tsconfig.json package.json .gitignore
git commit -m "chore: configure drizzle-kit and vitest"
```

---

## Task 3: DB Schema — Core Tables (products, product_cards, product_media)

**Files:**
- Create: `db/schema.ts` (partial — extended in Task 4)

- [ ] **Step 1: Create db/schema.ts with first 3 tables**

```typescript
// db/schema.ts
import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 1. products — root entity
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sku: text('sku').notNull().unique(),
  barcode: text('barcode'),
  productProfile: text('product_profile', { enum: ['accessories', 'parts'] }).notNull(),
  nameRu: text('name_ru').notNull(),
  nameUz: text('name_uz').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// 2. product_cards — all Uzum-required card fields
// properties/characteristics/filter_properties stored as JSON strings
export const productCards = sqliteTable('product_cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  titleRu: text('title_ru'),
  titleUz: text('title_uz'),
  descriptionRu: text('description_ru'),
  descriptionUz: text('description_uz'),
  shortDescRu: text('short_desc_ru'),
  shortDescUz: text('short_desc_uz'),
  // JSON array of {name_ru, name_uz, value_ru, value_uz}
  propertiesRu: text('properties_ru'), // JSON: string[]
  propertiesUz: text('properties_uz'), // JSON: string[]
  // JSON array of {name_ru, name_uz, value_ru, value_uz}
  characteristics: text('characteristics'), // JSON
  // JSON array of {name_ru, name_uz, value_ru, value_uz}
  filterProperties: text('filter_properties'), // JSON
  brand: text('brand'),
  vatPct: integer('vat_pct'), // 0, 10, or 20
  weightKg: real('weight_kg'),
  dimLengthCm: real('dim_length_cm'),
  dimWidthCm: real('dim_width_cm'),
  dimHeightCm: real('dim_height_cm'),
});

// 3. product_media — photos and videos
// §12.3 Uzum: photos ≥1080×1440, 3:4 ratio, ≤5MB; videos ≤10MB
export const productMedia = sqliteTable('product_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  mediaType: text('media_type', { enum: ['photo', 'video'] }).notNull(),
  widthPx: integer('width_px'),
  heightPx: integer('height_px'),
  sizeBytes: integer('size_bytes'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  orderIndex: integer('order_index').notNull().default(0),
  isCompliant: integer('is_compliant', { mode: 'boolean' }),
  complianceNotes: text('compliance_notes'),
});
```

- [ ] **Step 2: Commit partial schema**

```bash
git add db/schema.ts
git commit -m "feat(db): add products, product_cards, product_media tables"
```

---

## Task 4: DB Schema — Profile Tables (accessories_data, parts_data)

**Files:**
- Modify: `db/schema.ts`

- [ ] **Step 1: Append accessories_data and parts_data to db/schema.ts**

Add after the `productMedia` definition:

```typescript
// 4. accessories_data — extended fields for ~80% of catalog
// color_options, kit_contents stored as JSON arrays
export const accessoriesData = sqliteTable('accessories_data', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().unique().references(() => products.id, { onDelete: 'cascade' }),
  universalFit: integer('universal_fit', { mode: 'boolean' }),
  useCaseRu: text('use_case_ru'),
  useCaseUz: text('use_case_uz'),
  materialRu: text('material_ru'),
  materialUz: text('material_uz'),
  // JSON: string[]
  colorOptions: text('color_options'),
  volumeMl: real('volume_ml'),
  applicationMethodRu: text('application_method_ru'),
  applicationMethodUz: text('application_method_uz'),
  kitContentsRu: text('kit_contents_ru'),
  kitContentsUz: text('kit_contents_uz'),
  // JSON: {description_ru, description_uz, items: string[]}
  bundleInfo: text('bundle_info'),
});

// 5. parts_data — extended fields for ~20% of catalog
// compatible_models: JSON [{make, model, year_from, year_to, engine}]
// cross_references: JSON string[]
export const partsData = sqliteTable('parts_data', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().unique().references(() => products.id, { onDelete: 'cascade' }),
  oemNumber: text('oem_number'),
  // JSON: string[]
  crossReferences: text('cross_references'),
  // JSON: {make: string, model: string, year_from: number, year_to: number, engine: string}[]
  compatibleModels: text('compatible_models'),
  positionRu: text('position_ru'),
  positionUz: text('position_uz'),
  partLengthMm: real('part_length_mm'),
  partWidthMm: real('part_width_mm'),
  partHeightMm: real('part_height_mm'),
  partWeightG: real('part_weight_g'),
  warrantyMonths: integer('warranty_months'),
  materialSpec: text('material_spec'),
});
```

- [ ] **Step 2: Commit**

```bash
git add db/schema.ts
git commit -m "feat(db): add accessories_data and parts_data tables"
```

---

## Task 5: DB Schema — Operational Tables (pricing, fulfillment, performance, moderation, boost)

**Files:**
- Modify: `db/schema.ts`

- [ ] **Step 1: Append remaining 5 tables to db/schema.ts**

```typescript
// 6. pricing
export const pricing = sqliteTable('pricing', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().unique().references(() => products.id, { onDelete: 'cascade' }),
  costPrice: real('cost_price'),
  sellingPrice: real('selling_price'),
  discountPrice: real('discount_price'),
  marginPct: real('margin_pct'),
  competitorPrice: real('competitor_price'),
  competitorUrl: text('competitor_url'),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// 7. fulfillment
// §5.3 Uzum: FBO free window = 60 days, warn at 45, critical at 55
export const fulfillment = sqliteTable('fulfillment', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().unique().references(() => products.id, { onDelete: 'cascade' }),
  scheme: text('scheme', { enum: ['FBS', 'FBO', 'DBS', 'EDBS'] }).notNull().default('FBS'),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  fboTurnoverDays: integer('fbo_turnover_days'),
  isOversized: integer('is_oversized', { mode: 'boolean' }).notNull().default(false),
});

// 8. performance — date-stamped snapshots
export const performance = sqliteTable('performance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // ISO date string YYYY-MM-DD
  impressions: integer('impressions').notNull().default(0),
  opens: integer('opens').notNull().default(0),
  cart: integer('cart').notNull().default(0),
  orders: integer('orders').notNull().default(0),
  received: integer('received').notNull().default(0),
  returns: integer('returns').notNull().default(0),
  conversionPct: real('conversion_pct'),
  revenue: real('revenue'),
  rating: real('rating'),
  reviews: integer('reviews'),
  roiPct: real('roi_pct'),
});

// 9. moderation
export const moderation = sqliteTable('moderation', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().unique().references(() => products.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['draft', 'ready', 'on_sale', 'blocked', 'archived'] })
    .notNull()
    .default('draft'),
  blockReason: text('block_reason'),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// 10. boost — ad campaign data
export const boost = sqliteTable('boost', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().unique().references(() => products.id, { onDelete: 'cascade' }),
  campaignType: text('campaign_type'),
  bidPer1000: real('bid_per_1000'),
  dailyBudget: real('daily_budget'),
  totalBudget: real('total_budget'),
  // JSON: string[]
  keywords: text('keywords'),
  // JSON: string[]
  negativeKeywords: text('negative_keywords'),
  drrPct: real('drr_pct'),
});
```

- [ ] **Step 2: Export inferred types at bottom of db/schema.ts**

```typescript
// Inferred types for use throughout the app
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductCard = typeof productCards.$inferSelect;
export type NewProductCard = typeof productCards.$inferInsert;
export type ProductMedia = typeof productMedia.$inferSelect;
export type AccessoriesData = typeof accessoriesData.$inferSelect;
export type PartsData = typeof partsData.$inferSelect;
export type Pricing = typeof pricing.$inferSelect;
export type Fulfillment = typeof fulfillment.$inferSelect;
export type Performance = typeof performance.$inferSelect;
export type Moderation = typeof moderation.$inferSelect;
export type Boost = typeof boost.$inferSelect;
```

- [ ] **Step 3: Commit**

```bash
git add db/schema.ts
git commit -m "feat(db): add pricing, fulfillment, performance, moderation, boost tables + types"
```

---

## Task 6: DB Client + Migration Runner

**Files:**
- Create: `db/index.ts`
- Create: `db/migrate.ts`

- [ ] **Step 1: Create db/index.ts**

```typescript
// db/index.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'aapa-tracker.db');

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(dbPath);
// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export { sqlite };
```

- [ ] **Step 2: Create db/migrate.ts**

```typescript
// db/migrate.ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index';
import path from 'path';

migrate(db, { migrationsFolder: path.join(process.cwd(), 'db/migrations') });
console.log('Migrations applied successfully');
```

- [ ] **Step 3: Commit**

```bash
git add db/index.ts db/migrate.ts
git commit -m "feat(db): add db client singleton and migration runner"
```

---

## Task 7: Generate and Apply Migrations

**Files:**
- Create: `db/migrations/` (auto-generated)

- [ ] **Step 1: Generate migration from schema**

```bash
npm run db:generate
```

Expected: `db/migrations/0000_*.sql` created

- [ ] **Step 2: Run migration**

```bash
npm run db:migrate
```

Expected: `Migrations applied successfully`

- [ ] **Step 3: Verify tables exist**

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('./data/aapa-tracker.db');
const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all();
console.log(tables.map(t => t.name).join(', '));
"
```

Expected output includes: `products, product_cards, product_media, accessories_data, parts_data, pricing, fulfillment, performance, moderation, boost`

- [ ] **Step 4: Commit**

```bash
git add db/migrations/
git commit -m "feat(db): add initial migration — 10 tables"
```

---

## Task 8: Constants

**Files:**
- Create: `lib/constants.ts`

- [ ] **Step 1: Create lib/constants.ts**

```typescript
// lib/constants.ts

// Product profiles
export const PRODUCT_PROFILES = ['accessories', 'parts'] as const;
export type ProductProfile = (typeof PRODUCT_PROFILES)[number];

// Fulfillment schemes
export const FULFILLMENT_SCHEMES = ['FBS', 'FBO', 'DBS', 'EDBS'] as const;
export type FulfillmentScheme = (typeof FULFILLMENT_SCHEMES)[number];

// Moderation statuses
export const MODERATION_STATUSES = ['draft', 'ready', 'on_sale', 'blocked', 'archived'] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

// VAT options (Uzbekistan)
export const VAT_OPTIONS = [0, 10, 20] as const;

// FBO turnover thresholds — §5.3 Uzum
export const FBO_TURNOVER_WARN_DAYS = 45;
export const FBO_TURNOVER_CRITICAL_DAYS = 55;
export const FBO_FREE_WINDOW_DAYS = 60;

// Photo compliance rules — §12.3 Uzum
export const PHOTO_MIN_WIDTH_PX = 1080;
export const PHOTO_MIN_HEIGHT_PX = 1440;
export const PHOTO_ASPECT_RATIO = 3 / 4; // width/height
export const PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const VIDEO_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const PHOTO_ASPECT_TOLERANCE = 0.02; // allow ±2% from perfect 3:4

// Minimum counts
export const MIN_PHOTOS = 3;
export const MIN_PROPERTIES = 3;

// Score display thresholds
export const SCORE_RED_MAX = 49;
export const SCORE_YELLOW_MAX = 69;
export const SCORE_BLUE_MAX = 89;
// ≥90 = green

// Uzum stop-word patterns — §8.2 Uzum (no subjective claims, no contact info, no promo)
// These patterns are used against Russian and Uzbek text fields
export const STOP_WORD_PATTERNS: RegExp[] = [
  // Contact info
  /\+?[\d\s\-()]{10,}/,         // phone numbers
  /\b\d{2}[-\s]\d{3}[-\s]\d{2}[-\s]\d{2}\b/, // formatted phone
  /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i, // email
  /https?:\/\//i,               // URLs
  /telegram|whatsapp|instagram|tiktok/i, // social media
  // Promotional language
  /\b(лучш(ий|ая|ее|ие)|best)\b/i,
  /\b(самый|самая|самое|самые)\s+(лучш|дешев|дорог)/i,
  /\bсупер\b|\bsuper\b/i,
  /\bакция\b|\bраспродажа\b|\bскидка\b/i,
  /\bбесплатн/i,
  /\bгарантир(ован|уем|уется)/i, // "we guarantee" as subjective
  // Misleading quality claims
  /\b(оригинал|original|100%)\b/i,
  /\bлюкс\b|\blux\b|\bluxury\b/i,
  // Call to action
  /\bзакажи(те)?\b|\bкупи(те)?\b|\bзвони(те)?\b/i,
];

// Accessory subtypes (for UI filters)
export const ACCESSORY_SUBTYPES = [
  'Автохимия',
  'Автокосметика',
  'Чехлы и накидки',
  'Аксессуары для салона',
  'Аксессуары для кузова',
  'Электроника и навигация',
  'Шины и диски',
  'Инструменты',
  'Буксировка и прицепы',
  'Прочее',
] as const;

// Auto part types
export const PART_TYPES = [
  'Двигатель и навесное',
  'Трансмиссия',
  'Ходовая',
  'Тормозная система',
  'Топливная система',
  'Электрика',
  'Кузов и стекло',
  'Фильтры',
  'Охлаждение',
  'Прочее',
] as const;
```

- [ ] **Step 2: Commit**

```bash
git add lib/constants.ts
git commit -m "feat(lib): add constants (Uzum rules, enums, stop-word patterns)"
```

---

## Task 9: Validators

**Files:**
- Create: `lib/validators.ts`
- Create: `lib/validators.test.ts`

- [ ] **Step 1: Create lib/validators.ts**

```typescript
// lib/validators.ts
import {
  STOP_WORD_PATTERNS,
  PHOTO_MIN_WIDTH_PX,
  PHOTO_MIN_HEIGHT_PX,
  PHOTO_ASPECT_RATIO,
  PHOTO_ASPECT_TOLERANCE,
  PHOTO_MAX_SIZE_BYTES,
  VIDEO_MAX_SIZE_BYTES,
} from './constants';
import type { ProductCard, ProductMedia } from '@/db/schema';

export type ValidationResult = {
  valid: boolean;
  violations: string[];
};

// Check text for Uzum stop-words — §8.2 Uzum
export function checkStopWords(text: string): ValidationResult {
  const violations: string[] = [];
  for (const pattern of STOP_WORD_PATTERNS) {
    if (pattern.test(text)) {
      violations.push(`Banned pattern found: ${pattern.toString()}`);
    }
  }
  return { valid: violations.length === 0, violations };
}

// Check a single photo for Uzum compliance — §12.3 Uzum
export function checkPhotoCompliance(media: Pick<ProductMedia, 'widthPx' | 'heightPx' | 'sizeBytes' | 'mediaType'>): ValidationResult {
  const violations: string[] = [];

  if (media.mediaType === 'photo') {
    if (media.widthPx !== null && media.widthPx !== undefined && media.widthPx < PHOTO_MIN_WIDTH_PX) {
      violations.push(`Width ${media.widthPx}px < required ${PHOTO_MIN_WIDTH_PX}px`);
    }
    if (media.heightPx !== null && media.heightPx !== undefined && media.heightPx < PHOTO_MIN_HEIGHT_PX) {
      violations.push(`Height ${media.heightPx}px < required ${PHOTO_MIN_HEIGHT_PX}px`);
    }
    if (media.widthPx && media.heightPx) {
      const ratio = media.widthPx / media.heightPx;
      if (Math.abs(ratio - PHOTO_ASPECT_RATIO) > PHOTO_ASPECT_TOLERANCE) {
        violations.push(`Aspect ratio ${ratio.toFixed(3)} deviates from required 3:4 (0.750)`);
      }
    }
    if (media.sizeBytes !== null && media.sizeBytes !== undefined && media.sizeBytes > PHOTO_MAX_SIZE_BYTES) {
      violations.push(`File size ${(media.sizeBytes / 1024 / 1024).toFixed(1)}MB exceeds 5MB limit`);
    }
  } else if (media.mediaType === 'video') {
    if (media.sizeBytes !== null && media.sizeBytes !== undefined && media.sizeBytes > VIDEO_MAX_SIZE_BYTES) {
      violations.push(`Video size ${(media.sizeBytes / 1024 / 1024).toFixed(1)}MB exceeds 10MB limit`);
    }
  }

  return { valid: violations.length === 0, violations };
}

// Check that both RU and UZ fields are filled for bilingual compliance
export function checkBilingual(card: Pick<ProductCard, 'titleRu' | 'titleUz' | 'descriptionRu' | 'descriptionUz'>): ValidationResult {
  const violations: string[] = [];
  const checks: [string, string | null | undefined][] = [
    ['Title RU', card.titleRu],
    ['Title UZ', card.titleUz],
    ['Description RU', card.descriptionRu],
    ['Description UZ', card.descriptionUz],
  ];
  for (const [label, value] of checks) {
    if (!value || value.trim().length === 0) {
      violations.push(`${label} is empty`);
    }
  }
  return { valid: violations.length === 0, violations };
}
```

- [ ] **Step 2: Write failing tests in lib/validators.test.ts**

```typescript
// lib/validators.test.ts
import { describe, it, expect } from 'vitest';
import { checkStopWords, checkPhotoCompliance, checkBilingual } from './validators';

describe('checkStopWords', () => {
  it('passes clean text', () => {
    const result = checkStopWords('Автомобильный коврик для салона из экокожи');
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('catches phone numbers', () => {
    const result = checkStopWords('Звоните +998 90 123 45 67');
    expect(result.valid).toBe(false);
  });

  it('catches "best" superlative', () => {
    const result = checkStopWords('Лучший продукт на рынке');
    expect(result.valid).toBe(false);
  });

  it('catches promotional language', () => {
    const result = checkStopWords('Акция! Скидка 50%');
    expect(result.valid).toBe(false);
  });

  it('catches URLs', () => {
    const result = checkStopWords('Подробнее на https://store.uz');
    expect(result.valid).toBe(false);
  });
});

describe('checkPhotoCompliance', () => {
  it('passes compliant photo', () => {
    const result = checkPhotoCompliance({
      mediaType: 'photo',
      widthPx: 1080,
      heightPx: 1440,
      sizeBytes: 2 * 1024 * 1024,
    });
    expect(result.valid).toBe(true);
  });

  it('fails photo with insufficient resolution', () => {
    const result = checkPhotoCompliance({
      mediaType: 'photo',
      widthPx: 800,
      heightPx: 600,
      sizeBytes: 1024 * 1024,
    });
    expect(result.valid).toBe(false);
    expect(result.violations.some(v => v.includes('800px'))).toBe(true);
  });

  it('fails photo with wrong aspect ratio', () => {
    const result = checkPhotoCompliance({
      mediaType: 'photo',
      widthPx: 1080,
      heightPx: 1080, // square — 1:1 not 3:4
      sizeBytes: 1024 * 1024,
    });
    expect(result.valid).toBe(false);
    expect(result.violations.some(v => v.includes('ratio'))).toBe(true);
  });

  it('fails photo over 5MB', () => {
    const result = checkPhotoCompliance({
      mediaType: 'photo',
      widthPx: 1080,
      heightPx: 1440,
      sizeBytes: 6 * 1024 * 1024,
    });
    expect(result.valid).toBe(false);
    expect(result.violations.some(v => v.includes('5MB'))).toBe(true);
  });

  it('fails video over 10MB', () => {
    const result = checkPhotoCompliance({
      mediaType: 'video',
      widthPx: null,
      heightPx: null,
      sizeBytes: 11 * 1024 * 1024,
    });
    expect(result.valid).toBe(false);
  });

  it('passes compliant video', () => {
    const result = checkPhotoCompliance({
      mediaType: 'video',
      widthPx: null,
      heightPx: null,
      sizeBytes: 8 * 1024 * 1024,
    });
    expect(result.valid).toBe(true);
  });
});

describe('checkBilingual', () => {
  it('passes fully bilingual card', () => {
    const result = checkBilingual({
      titleRu: 'Коврик в салон',
      titleUz: 'Salon gilamchasi',
      descriptionRu: 'Качественный коврик',
      descriptionUz: 'Sifatli gilamcha',
    });
    expect(result.valid).toBe(true);
  });

  it('fails when UZ title missing', () => {
    const result = checkBilingual({
      titleRu: 'Коврик в салон',
      titleUz: '',
      descriptionRu: 'Качественный коврик',
      descriptionUz: 'Sifatli gilamcha',
    });
    expect(result.valid).toBe(false);
    expect(result.violations[0]).toContain('Title UZ');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail correctly**

```bash
npm test lib/validators.test.ts
```

Expected: Tests pass (validators are already implemented — this confirms the implementation works)

- [ ] **Step 4: Commit**

```bash
git add lib/validators.ts lib/validators.test.ts
git commit -m "feat(lib): add validators with tests (stop-words, media compliance, bilingual)"
```

---

## Task 10: Scoring Engine

**Files:**
- Create: `lib/scoring.ts`
- Create: `lib/scoring.test.ts`

- [ ] **Step 1: Create lib/scoring.ts**

```typescript
// lib/scoring.ts
import type { ProductCard, ProductMedia, AccessoriesData, PartsData, Pricing } from '@/db/schema';
import { MIN_PHOTOS, MIN_PROPERTIES } from './constants';
import { checkPhotoCompliance } from './validators';

export type ProductDataForScoring = {
  profile: 'accessories' | 'parts';
  card: Partial<ProductCard>;
  media: ProductMedia[];
  accessoriesData?: Partial<AccessoriesData> | null;
  partsData?: Partial<PartsData> | null;
  pricing?: Partial<Pricing> | null;
};

export type ScoreBreakdown = {
  total: number;       // 0-100
  maxPossible: number; // always 100
  color: 'red' | 'yellow' | 'blue' | 'green';
  fields: { label: string; weight: number; earned: number; met: boolean }[];
};

function parseJsonArray(json: string | null | undefined): unknown[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function hasPrimaryFrontPhoto(media: ProductMedia[]): boolean {
  return media.some(m => m.isPrimary && m.mediaType === 'photo');
}

function allPhotosCompliant(media: ProductMedia[]): boolean {
  const photos = media.filter(m => m.mediaType === 'photo');
  if (photos.length === 0) return false;
  return photos.every(m => checkPhotoCompliance(m).valid);
}

// Accessories scoring — weight total = 100
const ACCESSORIES_FIELDS: {
  label: string;
  weight: number;
  check: (d: ProductDataForScoring) => boolean;
}[] = [
  {
    label: 'Photos ≥3',
    weight: 9,
    check: d => d.media.filter(m => m.mediaType === 'photo').length >= MIN_PHOTOS,
  },
  {
    label: 'Filter properties',
    weight: 8,
    check: d => parseJsonArray(d.card.filterProperties).length > 0,
  },
  { label: 'Title RU', weight: 8, check: d => !!d.card.titleRu?.trim() },
  { label: 'Title UZ', weight: 8, check: d => !!d.card.titleUz?.trim() },
  { label: 'Description RU', weight: 7, check: d => !!d.card.descriptionRu?.trim() },
  { label: 'Description UZ', weight: 7, check: d => !!d.card.descriptionUz?.trim() },
  {
    label: 'Use case described',
    weight: 6,
    check: d => !!d.accessoriesData?.useCaseRu?.trim(),
  },
  {
    label: 'Properties RU ≥3',
    weight: 5,
    check: d => parseJsonArray(d.card.propertiesRu).length >= MIN_PROPERTIES,
  },
  {
    label: 'Properties UZ ≥3',
    weight: 5,
    check: d => parseJsonArray(d.card.propertiesUz).length >= MIN_PROPERTIES,
  },
  { label: 'Short description', weight: 5, check: d => !!d.card.shortDescRu?.trim() },
  {
    label: 'Video present',
    weight: 5,
    check: d => d.media.some(m => m.mediaType === 'video'),
  },
  { label: 'All photos compliant', weight: 5, check: d => allPhotosCompliant(d.media) },
  { label: 'Brand', weight: 4, check: d => !!d.card.brand?.trim() },
  {
    label: 'Bundle info (if applicable)',
    weight: 4,
    check: d => !!d.accessoriesData?.bundleInfo,
  },
  {
    label: 'Primary photo (front view)',
    weight: 3,
    check: d => hasPrimaryFrontPhoto(d.media),
  },
  {
    label: 'Weight & dimensions',
    weight: 3,
    check: d =>
      d.card.weightKg != null &&
      d.card.dimLengthCm != null &&
      d.card.dimWidthCm != null &&
      d.card.dimHeightCm != null,
  },
  { label: 'Price set', weight: 3, check: d => d.pricing?.sellingPrice != null },
  { label: 'Competitor price', weight: 3, check: d => d.pricing?.competitorPrice != null },
  { label: 'VAT', weight: 2, check: d => d.card.vatPct != null },
];

// Parts scoring — weight total = 100
const PARTS_FIELDS: {
  label: string;
  weight: number;
  check: (d: ProductDataForScoring) => boolean;
}[] = [
  {
    label: 'Compatible models',
    weight: 12,
    check: d => parseJsonArray(d.partsData?.compatibleModels).length > 0,
  },
  { label: 'OEM number', weight: 10, check: d => !!d.partsData?.oemNumber?.trim() },
  { label: 'Title RU', weight: 7, check: d => !!d.card.titleRu?.trim() },
  { label: 'Title UZ', weight: 7, check: d => !!d.card.titleUz?.trim() },
  {
    label: 'Filter properties',
    weight: 5,
    check: d => parseJsonArray(d.card.filterProperties).length > 0,
  },
  {
    label: 'Photos ≥3',
    weight: 5,
    check: d => d.media.filter(m => m.mediaType === 'photo').length >= MIN_PHOTOS,
  },
  {
    label: 'Properties RU ≥3',
    weight: 4,
    check: d => parseJsonArray(d.card.propertiesRu).length >= MIN_PROPERTIES,
  },
  {
    label: 'Properties UZ ≥3',
    weight: 4,
    check: d => parseJsonArray(d.card.propertiesUz).length >= MIN_PROPERTIES,
  },
  {
    label: 'Weight & dimensions',
    weight: 4,
    check: d =>
      d.card.weightKg != null &&
      d.card.dimLengthCm != null &&
      d.card.dimWidthCm != null &&
      d.card.dimHeightCm != null,
  },
  { label: 'Brand', weight: 4, check: d => !!d.card.brand?.trim() },
  { label: 'All photos compliant', weight: 4, check: d => allPhotosCompliant(d.media) },
  {
    label: 'Cross-references',
    weight: 4,
    check: d => parseJsonArray(d.partsData?.crossReferences).length > 0,
  },
  {
    label: 'Fitment position',
    weight: 4,
    check: d => !!d.partsData?.positionRu?.trim(),
  },
  { label: 'Material/spec', weight: 4, check: d => !!d.partsData?.materialSpec?.trim() },
  { label: 'Description RU', weight: 4, check: d => !!d.card.descriptionRu?.trim() },
  { label: 'Description UZ', weight: 4, check: d => !!d.card.descriptionUz?.trim() },
  { label: 'Short description', weight: 3, check: d => !!d.card.shortDescRu?.trim() },
  {
    label: 'Warranty',
    weight: 3,
    check: d => d.partsData?.warrantyMonths != null,
  },
  { label: 'Price set', weight: 3, check: d => d.pricing?.sellingPrice != null },
  {
    label: 'Part dimensions',
    weight: 3,
    check: d =>
      d.partsData?.partLengthMm != null &&
      d.partsData?.partWidthMm != null &&
      d.partsData?.partHeightMm != null,
  },
  {
    label: 'Primary photo (front view)',
    weight: 2,
    check: d => hasPrimaryFrontPhoto(d.media),
  },
  { label: 'VAT', weight: 2, check: d => d.card.vatPct != null },
];

function scoreColor(total: number): ScoreBreakdown['color'] {
  if (total <= 49) return 'red';
  if (total <= 69) return 'yellow';
  if (total <= 89) return 'blue';
  return 'green';
}

export function computeScore(data: ProductDataForScoring): ScoreBreakdown {
  const fields = data.profile === 'accessories' ? ACCESSORIES_FIELDS : PARTS_FIELDS;

  let total = 0;
  const breakdown = fields.map(f => {
    const met = f.check(data);
    const earned = met ? f.weight : 0;
    total += earned;
    return { label: f.label, weight: f.weight, earned, met };
  });

  return {
    total,
    maxPossible: 100,
    color: scoreColor(total),
    fields: breakdown,
  };
}
```

- [ ] **Step 2: Write tests in lib/scoring.test.ts**

```typescript
// lib/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { computeScore } from './scoring';
import type { ProductDataForScoring } from './scoring';

const emptyAccessories: ProductDataForScoring = {
  profile: 'accessories',
  card: {},
  media: [],
  accessoriesData: null,
  pricing: null,
};

const emptyParts: ProductDataForScoring = {
  profile: 'parts',
  card: {},
  media: [],
  partsData: null,
  pricing: null,
};

describe('computeScore — accessories', () => {
  it('scores 0 for empty product', () => {
    const result = computeScore(emptyAccessories);
    expect(result.total).toBe(0);
    expect(result.color).toBe('red');
  });

  it('scores title fields correctly', () => {
    const result = computeScore({
      ...emptyAccessories,
      card: { titleRu: 'Коврик', titleUz: 'Gilamcha' },
    });
    // Title RU = 8, Title UZ = 8
    expect(result.total).toBe(16);
    expect(result.fields.find(f => f.label === 'Title RU')?.met).toBe(true);
    expect(result.fields.find(f => f.label === 'Title UZ')?.met).toBe(true);
  });

  it('scores photos ≥3 when 3 photos present', () => {
    const photos = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      productId: 1,
      url: `https://example.com/photo${i}.jpg`,
      mediaType: 'photo' as const,
      widthPx: 1080,
      heightPx: 1440,
      sizeBytes: 2 * 1024 * 1024,
      isPrimary: i === 0,
      orderIndex: i,
      isCompliant: true,
      complianceNotes: null,
    }));
    const result = computeScore({ ...emptyAccessories, media: photos });
    expect(result.fields.find(f => f.label === 'Photos ≥3')?.met).toBe(true);
    expect(result.fields.find(f => f.label === 'All photos compliant')?.met).toBe(true);
    expect(result.fields.find(f => f.label === 'Primary photo (front view)')?.met).toBe(true);
  });

  it('does not score photos ≥3 when only 2 photos', () => {
    const photos = Array.from({ length: 2 }, (_, i) => ({
      id: i,
      productId: 1,
      url: `https://example.com/photo${i}.jpg`,
      mediaType: 'photo' as const,
      widthPx: 1080,
      heightPx: 1440,
      sizeBytes: 2 * 1024 * 1024,
      isPrimary: false,
      orderIndex: i,
      isCompliant: null,
      complianceNotes: null,
    }));
    const result = computeScore({ ...emptyAccessories, media: photos });
    expect(result.fields.find(f => f.label === 'Photos ≥3')?.met).toBe(false);
  });

  it('max score is 100 when all fields complete', () => {
    const photos = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      productId: 1,
      url: `https://example.com/photo${i}.jpg`,
      mediaType: 'photo' as const,
      widthPx: 1080,
      heightPx: 1440,
      sizeBytes: 2 * 1024 * 1024,
      isPrimary: i === 0,
      orderIndex: i,
      isCompliant: true,
      complianceNotes: null,
    }));
    const video = {
      id: 99,
      productId: 1,
      url: 'https://example.com/video.mp4',
      mediaType: 'video' as const,
      widthPx: null,
      heightPx: null,
      sizeBytes: 5 * 1024 * 1024,
      isPrimary: false,
      orderIndex: 10,
      isCompliant: true,
      complianceNotes: null,
    };
    const propsJson = JSON.stringify(['p1', 'p2', 'p3']);
    const result = computeScore({
      profile: 'accessories',
      card: {
        titleRu: 'Коврик',
        titleUz: 'Gilamcha',
        descriptionRu: 'Описание',
        descriptionUz: 'Tavsif',
        shortDescRu: 'Краткое',
        propertiesRu: propsJson,
        propertiesUz: propsJson,
        filterProperties: JSON.stringify([{ name: 'Тип', value: 'Коврик' }]),
        brand: 'Brand',
        vatPct: 0,
        weightKg: 0.5,
        dimLengthCm: 30,
        dimWidthCm: 20,
        dimHeightCm: 2,
      },
      media: [...photos, video],
      accessoriesData: {
        useCaseRu: 'Защита пола',
        bundleInfo: JSON.stringify({ description_ru: 'Комплект', items: ['item1'] }),
      },
      pricing: { sellingPrice: 50000, competitorPrice: 55000 },
    });
    expect(result.total).toBe(100);
    expect(result.color).toBe('green');
  });
});

describe('computeScore — parts', () => {
  it('scores 0 for empty parts product', () => {
    const result = computeScore(emptyParts);
    expect(result.total).toBe(0);
    expect(result.color).toBe('red');
  });

  it('scores compatible_models as highest-weight field (12)', () => {
    const result = computeScore({
      ...emptyParts,
      partsData: {
        compatibleModels: JSON.stringify([{ make: 'Toyota', model: 'Camry', year_from: 2018, year_to: 2023, engine: '2.5' }]),
      },
    });
    expect(result.fields.find(f => f.label === 'Compatible models')?.earned).toBe(12);
  });
});

describe('scoreColor thresholds', () => {
  it('red for score 0-49', () => {
    expect(computeScore(emptyAccessories).color).toBe('red');
  });

  it('yellow for score 50-69', () => {
    // Title RU(8) + Title UZ(8) + Desc RU(7) + Desc UZ(7) + Short desc(5) + Brand(4) + VAT(2) + Competitor(3) + Price(3) + Use case(6) = 53
    const result = computeScore({
      ...emptyAccessories,
      card: {
        titleRu: 'T', titleUz: 'T', descriptionRu: 'D', descriptionUz: 'D',
        shortDescRu: 'S', brand: 'B', vatPct: 0,
      },
      accessoriesData: { useCaseRu: 'Use case' },
      pricing: { sellingPrice: 10000, competitorPrice: 11000 },
    });
    expect(result.total).toBe(50);
    expect(result.color).toBe('yellow');
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add lib/scoring.ts lib/scoring.test.ts
git commit -m "feat(lib): add dual-profile scoring engine with tests"
```

---

## Task 11: Seed Data

**Files:**
- Create: `db/seed.ts`

- [ ] **Step 1: Create db/seed.ts**

```typescript
// db/seed.ts
import { db } from './index';
import {
  products, productCards, productMedia,
  accessoriesData, partsData,
  pricing, fulfillment, moderation,
} from './schema';

async function seed() {
  console.log('Seeding database...');

  // --- 5 Accessories ---

  // 1. Floor mats
  const [mat] = await db.insert(products).values({
    sku: 'ACC-001',
    barcode: '4607812345001',
    productProfile: 'accessories',
    nameRu: 'Автомобильные коврики в салон',
    nameUz: 'Avtomobil salon gilamchalari',
  }).returning();

  await db.insert(productCards).values({
    productId: mat.id,
    titleRu: 'Коврики автомобильные в салон универсальные ЭВА',
    titleUz: 'Universal EVA avtomobil salon gilamchalari',
    descriptionRu: 'Высококачественные коврики из ЭВА материала. Защищают пол от грязи и влаги. Легко моются.',
    descriptionUz: 'EVA materialidan tayyorlangan yuqori sifatli gilamchalar. Polni kir va namlikdan himoya qiladi.',
    shortDescRu: 'ЭВА коврики для салона автомобиля',
    shortDescUz: 'Avtomobil saloni uchun EVA gilamchalar',
    propertiesRu: JSON.stringify(['Материал: ЭВА', 'Тип: универсальные', 'Цвет: черный']),
    propertiesUz: JSON.stringify(['Material: EVA', 'Turi: universal', 'Rangi: qora']),
    filterProperties: JSON.stringify([{ name_ru: 'Материал', value_ru: 'ЭВА', name_uz: 'Material', value_uz: 'EVA' }]),
    brand: 'AutoStyle',
    vatPct: 0,
    weightKg: 1.2,
    dimLengthCm: 60,
    dimWidthCm: 40,
    dimHeightCm: 3,
  });

  await db.insert(productMedia).values([
    { productId: mat.id, url: 'https://picsum.photos/seed/mat1/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 1500000, isPrimary: true, orderIndex: 0, isCompliant: true },
    { productId: mat.id, url: 'https://picsum.photos/seed/mat2/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 1400000, isPrimary: false, orderIndex: 1, isCompliant: true },
    { productId: mat.id, url: 'https://picsum.photos/seed/mat3/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 1300000, isPrimary: false, orderIndex: 2, isCompliant: true },
  ]);

  await db.insert(accessoriesData).values({
    productId: mat.id,
    universalFit: true,
    useCaseRu: 'Защита напольного покрытия от грязи, влаги и износа',
    useCaseUz: 'Polni kir, namlik va aşınmadan himoya qilish',
    materialRu: 'ЭВА (этиленвинилацетат)',
    materialUz: 'EVA (etilen-vinil asetat)',
    colorOptions: JSON.stringify(['Черный', 'Серый', 'Бежевый']),
  });

  await db.insert(pricing).values({ productId: mat.id, costPrice: 45000, sellingPrice: 89000, marginPct: 49.4, competitorPrice: 95000 });
  await db.insert(fulfillment).values({ productId: mat.id, scheme: 'FBO', stockQuantity: 45, fboTurnoverDays: 32 });
  await db.insert(moderation).values({ productId: mat.id, status: 'on_sale' });

  // 2. Car polish
  const [polish] = await db.insert(products).values({
    sku: 'ACC-002',
    barcode: '4607812345002',
    productProfile: 'accessories',
    nameRu: 'Полироль для кузова автомобиля',
    nameUz: 'Avtomobil kuzovi uchun polrol',
  }).returning();

  await db.insert(productCards).values({
    productId: polish.id,
    titleRu: 'Полироль для кузова защитная с карнаубским воском 500мл',
    titleUz: 'Karnuba mumli himoya polroli, kuzov uchun 500ml',
    descriptionRu: 'Защитная полироль с натуральным карнаубским воском. Создаёт защитный слой на 3 месяца.',
    descriptionUz: 'Tabiiy karnuba mumi bilan himoya polroli. 3 oyga himoya qatlami yaratadi.',
    shortDescRu: 'Полироль с воском 500мл',
    shortDescUz: 'Mumli polrol 500ml',
    propertiesRu: JSON.stringify(['Объём: 500 мл', 'Тип: защитная', 'Состав: карнаубский воск']),
    propertiesUz: JSON.stringify(['Hajmi: 500 ml', 'Turi: himoya', 'Tarkibi: karnuba mumi']),
    filterProperties: JSON.stringify([{ name_ru: 'Объём', value_ru: '500 мл' }]),
    brand: 'ChemPro',
    vatPct: 10,
    weightKg: 0.55,
    dimLengthCm: 8,
    dimWidthCm: 8,
    dimHeightCm: 20,
  });

  await db.insert(productMedia).values([
    { productId: polish.id, url: 'https://picsum.photos/seed/pol1/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 1200000, isPrimary: true, orderIndex: 0, isCompliant: true },
    { productId: polish.id, url: 'https://picsum.photos/seed/pol2/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 1100000, isPrimary: false, orderIndex: 1, isCompliant: true },
    { productId: polish.id, url: 'https://picsum.photos/seed/pol3/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 1000000, isPrimary: false, orderIndex: 2, isCompliant: true },
  ]);

  await db.insert(accessoriesData).values({
    productId: polish.id,
    useCaseRu: 'Полировка и защита лакокрасочного покрытия кузова',
    useCaseUz: 'Kuzov bo\'yoqli qoplamani sayqallash va himoya qilish',
    materialRu: 'Карнаубский воск, силиконы',
    volumeMl: 500,
    applicationMethodRu: 'Нанести на чистую поверхность, растереть круговыми движениями, полировать после высыхания',
    applicationMethodUz: 'Toza yuzaga surting, doira harakatlar bilan ishlang, qurigach sayqalang',
  });

  await db.insert(pricing).values({ productId: polish.id, costPrice: 22000, sellingPrice: 49000, marginPct: 55.1, competitorPrice: 52000 });
  await db.insert(fulfillment).values({ productId: polish.id, scheme: 'FBO', stockQuantity: 120, fboTurnoverDays: 18 });
  await db.insert(moderation).values({ productId: polish.id, status: 'on_sale' });

  // 3. Seat cover — incomplete card (for testing low score)
  const [cover] = await db.insert(products).values({
    sku: 'ACC-003',
    barcode: '4607812345003',
    productProfile: 'accessories',
    nameRu: 'Чехлы на сиденья',
    nameUz: 'O\'rindiq qoplamalari',
  }).returning();

  await db.insert(productCards).values({
    productId: cover.id,
    titleRu: 'Чехлы на сиденья автомобиля',
    titleUz: 'Avtomobil o\'rindig\'i qoplamalari',
    brand: 'AutoCover',
  });

  await db.insert(productMedia).values([
    { productId: cover.id, url: 'https://picsum.photos/seed/cov1/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 1000000, isPrimary: true, orderIndex: 0, isCompliant: true },
  ]);

  await db.insert(pricing).values({ productId: cover.id, sellingPrice: 120000 });
  await db.insert(fulfillment).values({ productId: cover.id, scheme: 'FBS', stockQuantity: 8 });
  await db.insert(moderation).values({ productId: cover.id, status: 'draft' });

  // 4. Dash cam
  const [cam] = await db.insert(products).values({
    sku: 'ACC-004',
    barcode: '4607812345004',
    productProfile: 'accessories',
    nameRu: 'Видеорегистратор автомобильный',
    nameUz: 'Avtomobil videokamerasi',
  }).returning();

  await db.insert(productCards).values({
    productId: cam.id,
    titleRu: 'Видеорегистратор Full HD 1080P с ночным видением',
    titleUz: 'Tungi ko\'rishli Full HD 1080P avtoregistrator',
    descriptionRu: 'Компактный видеорегистратор с матрицей Sony. Угол обзора 170°. Поддержка карт до 128ГБ.',
    descriptionUz: 'Sony matritsali ixcham videoregistrator. Ko\'rish burchagi 170°. 128GB kartalarni qo\'llab-quvvatlaydi.',
    shortDescRu: 'Видеорегистратор Full HD с ночным видением',
    shortDescUz: 'Tungi ko\'rishli Full HD videoregistrator',
    propertiesRu: JSON.stringify(['Разрешение: Full HD 1080P', 'Угол обзора: 170°', 'Ночное видение: есть']),
    propertiesUz: JSON.stringify(['Ruxsat: Full HD 1080P', 'Ko\'rish burchagi: 170°', 'Tungi ko\'rish: bor']),
    filterProperties: JSON.stringify([{ name_ru: 'Разрешение', value_ru: 'Full HD' }]),
    brand: 'DriveCam',
    vatPct: 20,
    weightKg: 0.09,
    dimLengthCm: 7,
    dimWidthCm: 5,
    dimHeightCm: 3,
  });

  await db.insert(productMedia).values([
    { productId: cam.id, url: 'https://picsum.photos/seed/cam1/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 900000, isPrimary: true, orderIndex: 0, isCompliant: true },
    { productId: cam.id, url: 'https://picsum.photos/seed/cam2/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 850000, isPrimary: false, orderIndex: 1, isCompliant: true },
    { productId: cam.id, url: 'https://picsum.photos/seed/cam3/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 800000, isPrimary: false, orderIndex: 2, isCompliant: true },
    { productId: cam.id, url: 'https://picsum.photos/seed/camv/mp4', mediaType: 'video', sizeBytes: 4000000, isPrimary: false, orderIndex: 3, isCompliant: true },
  ]);

  await db.insert(accessoriesData).values({
    productId: cam.id,
    useCaseRu: 'Фиксация дорожной обстановки, доказательная база при ДТП',
    useCaseUz: 'Yo\'l vaziyatini qayd etish, yo\'l-transport hodisasida dalil bazasi',
  });

  await db.insert(pricing).values({ productId: cam.id, costPrice: 180000, sellingPrice: 349000, marginPct: 48.4, competitorPrice: 380000 });
  await db.insert(fulfillment).values({ productId: cam.id, scheme: 'FBO', stockQuantity: 22, fboTurnoverDays: 48 });
  await db.insert(moderation).values({ productId: cam.id, status: 'on_sale' });

  // 5. Car air freshener
  const [fresh] = await db.insert(products).values({
    sku: 'ACC-005',
    barcode: '4607812345005',
    productProfile: 'accessories',
    nameRu: 'Ароматизатор для автомобиля',
    nameUz: 'Avtomobil uchun xushbo\'y',
  }).returning();

  await db.insert(productCards).values({
    productId: fresh.id,
    titleRu: 'Ароматизатор подвесной для автомобиля "Кофе" 5мл',
    titleUz: 'Avtomobil uchun osilma xushbo\'y "Qahva" 5ml',
    descriptionRu: 'Натуральный аромат кофе. Нейтрализует запахи. Срок действия 30 дней.',
    descriptionUz: 'Tabiiy qahva aromati. Hidlarni zararsizlantiradi. Amal qilish muddati 30 kun.',
    shortDescRu: 'Подвесной ароматизатор кофе',
    shortDescUz: 'Osilma qahva xushbo\'yi',
    propertiesRu: JSON.stringify(['Аромат: Кофе', 'Объём: 5 мл', 'Срок действия: 30 дней']),
    propertiesUz: JSON.stringify(['Hidlar: Qahva', 'Hajmi: 5 ml', 'Amal muddati: 30 kun']),
    filterProperties: JSON.stringify([{ name_ru: 'Аромат', value_ru: 'Кофе' }]),
    brand: 'AromaAuto',
    vatPct: 0,
    weightKg: 0.02,
    dimLengthCm: 5,
    dimWidthCm: 2,
    dimHeightCm: 10,
  });

  await db.insert(productMedia).values([
    { productId: fresh.id, url: 'https://picsum.photos/seed/fr1/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 700000, isPrimary: true, orderIndex: 0, isCompliant: true },
    { productId: fresh.id, url: 'https://picsum.photos/seed/fr2/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 650000, isPrimary: false, orderIndex: 1, isCompliant: true },
    { productId: fresh.id, url: 'https://picsum.photos/seed/fr3/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 600000, isPrimary: false, orderIndex: 2, isCompliant: true },
  ]);

  await db.insert(accessoriesData).values({
    productId: fresh.id,
    useCaseRu: 'Ароматизация салона автомобиля, устранение неприятных запахов',
    useCaseUz: 'Avtomobil salonini xushbo\'ylash, yoqimsiz hidlarni bartaraf etish',
    volumeMl: 5,
  });

  await db.insert(pricing).values({ productId: fresh.id, costPrice: 3500, sellingPrice: 9900, marginPct: 64.6, competitorPrice: 11000 });
  await db.insert(fulfillment).values({ productId: fresh.id, scheme: 'FBO', stockQuantity: 300, fboTurnoverDays: 12 });
  await db.insert(moderation).values({ productId: fresh.id, status: 'on_sale' });

  // --- 2 Parts ---

  // 6. Oil filter
  const [oilFilter] = await db.insert(products).values({
    sku: 'PRT-001',
    barcode: '4607812346001',
    productProfile: 'parts',
    nameRu: 'Фильтр масляный',
    nameUz: 'Moy filtri',
  }).returning();

  await db.insert(productCards).values({
    productId: oilFilter.id,
    titleRu: 'Фильтр масляный для Toyota Camry / Corolla / RAV4 2.0-2.5',
    titleUz: 'Toyota Camry / Corolla / RAV4 2.0-2.5 uchun moy filtri',
    descriptionRu: 'Оригинальный масляный фильтр для двигателей Toyota серии AR/AZ. Высокоэффективный фильтрующий элемент. Гарантия 1 год.',
    descriptionUz: 'Toyota AR/AZ seriyali dvigatellari uchun original moy filtri. Yuqori samarali filtrlovchi element. Kafolat 1 yil.',
    shortDescRu: 'Масляный фильтр Toyota 2.0-2.5',
    shortDescUz: 'Toyota 2.0-2.5 moy filtri',
    propertiesRu: JSON.stringify(['Тип: масляный', 'Резьба: M20×1.5', 'Высота: 65 мм']),
    propertiesUz: JSON.stringify(['Turi: moy', 'Rezba: M20×1.5', 'Balandligi: 65 mm']),
    filterProperties: JSON.stringify([{ name_ru: 'Тип', value_ru: 'Масляный' }, { name_ru: 'Марка', value_ru: 'Toyota' }]),
    brand: 'Toyota OEM',
    vatPct: 0,
    weightKg: 0.15,
    dimLengthCm: 7,
    dimWidthCm: 7,
    dimHeightCm: 6.5,
  });

  await db.insert(productMedia).values([
    { productId: oilFilter.id, url: 'https://picsum.photos/seed/of1/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 800000, isPrimary: true, orderIndex: 0, isCompliant: true },
    { productId: oilFilter.id, url: 'https://picsum.photos/seed/of2/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 750000, isPrimary: false, orderIndex: 1, isCompliant: true },
    { productId: oilFilter.id, url: 'https://picsum.photos/seed/of3/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 700000, isPrimary: false, orderIndex: 2, isCompliant: true },
  ]);

  await db.insert(partsData).values({
    productId: oilFilter.id,
    oemNumber: '90915-YZZD4',
    crossReferences: JSON.stringify(['90915-YZZD3', 'W68/1', 'OC459']),
    compatibleModels: JSON.stringify([
      { make: 'Toyota', model: 'Camry', year_from: 2017, year_to: 2024, engine: '2.5 AR-FE' },
      { make: 'Toyota', model: 'Corolla', year_from: 2019, year_to: 2024, engine: '2.0 M20A' },
      { make: 'Toyota', model: 'RAV4', year_from: 2018, year_to: 2024, engine: '2.5 A25A' },
    ]),
    positionRu: 'Двигатель, снизу',
    positionUz: 'Dvigatel, pastdan',
    partLengthMm: 70,
    partWidthMm: 70,
    partHeightMm: 65,
    partWeightG: 150,
    warrantyMonths: 12,
    materialSpec: 'Стальной корпус, целлюлозный фильтрующий элемент',
  });

  await db.insert(pricing).values({ productId: oilFilter.id, costPrice: 18000, sellingPrice: 38000, marginPct: 52.6, competitorPrice: 42000 });
  await db.insert(fulfillment).values({ productId: oilFilter.id, scheme: 'FBO', stockQuantity: 85, fboTurnoverDays: 22 });
  await db.insert(moderation).values({ productId: oilFilter.id, status: 'on_sale' });

  // 7. Brake pads — partially filled (low score)
  const [brakes] = await db.insert(products).values({
    sku: 'PRT-002',
    barcode: '4607812346002',
    productProfile: 'parts',
    nameRu: 'Тормозные колодки передние',
    nameUz: 'Old tormoz kolodkalari',
  }).returning();

  await db.insert(productCards).values({
    productId: brakes.id,
    titleRu: 'Колодки тормозные передние для Chevrolet Nexia / Lacetti',
    titleUz: 'Chevrolet Nexia / Lacetti uchun old tormoz kolodkalari',
    propertiesRu: JSON.stringify(['Позиция: передние', 'Тип: дисковые']),
    propertiesUz: JSON.stringify(['Pozitsiya: old', 'Turi: disk']),
    brand: 'Brembo',
    vatPct: 0,
  });

  await db.insert(productMedia).values([
    { productId: brakes.id, url: 'https://picsum.photos/seed/bp1/1080/1440', mediaType: 'photo', widthPx: 1080, heightPx: 1440, sizeBytes: 900000, isPrimary: true, orderIndex: 0, isCompliant: true },
    { productId: brakes.id, url: 'https://picsum.photos/seed/bp2/800/600', mediaType: 'photo', widthPx: 800, heightPx: 600, sizeBytes: 500000, isPrimary: false, orderIndex: 1, isCompliant: false, complianceNotes: 'Resolution too low, wrong aspect ratio' },
  ]);

  await db.insert(partsData).values({
    productId: brakes.id,
    compatibleModels: JSON.stringify([
      { make: 'Chevrolet', model: 'Nexia', year_from: 2020, year_to: 2024, engine: '1.5' },
      { make: 'Chevrolet', model: 'Lacetti', year_from: 2004, year_to: 2013, engine: '1.6' },
    ]),
    positionRu: 'Передние',
    positionUz: 'Old',
  });

  await db.insert(pricing).values({ productId: brakes.id, sellingPrice: 75000 });
  await db.insert(fulfillment).values({ productId: brakes.id, scheme: 'FBS', stockQuantity: 12 });
  await db.insert(moderation).values({ productId: brakes.id, status: 'draft' });

  console.log('Seed complete: 5 accessories + 2 parts');
}

seed().catch(console.error);
```

- [ ] **Step 2: Run seed**

```bash
npm run db:seed
```

Expected: `Seed complete: 5 accessories + 2 parts`

- [ ] **Step 3: Verify rows**

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('./data/aapa-tracker.db');
const count = db.prepare('SELECT product_profile, COUNT(*) as n FROM products GROUP BY product_profile').all();
console.log(count);
"
```

Expected:
```
[ { product_profile: 'accessories', n: 5 }, { product_profile: 'parts', n: 2 } ]
```

- [ ] **Step 4: Commit**

```bash
git add db/seed.ts
git commit -m "feat(db): add seed data — 5 accessories + 2 parts"
```

---

## Task 12: Theme Setup (Tailwind + CSS variables)

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update tailwind.config.ts with AAPA color tokens**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // AAPA custom tokens
        base: "#1a1a2e",
        "base-card": "#374151",
        accent: "#f59e0b",
        "score-red": "#ef4444",
        "score-yellow": "#eab308",
        "score-blue": "#3b82f6",
        "score-green": "#22c55e",
        "profile-accessories": "#f59e0b",
        "profile-parts": "#3b82f6",
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 2: Update app/globals.css with dark theme CSS variables**

Replace the contents of `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #1a1a2e;
  --foreground: #e5e7eb;
  --card: #374151;
  --card-foreground: #f9fafb;
  --border: #4b5563;
  --input: #374151;
  --ring: #f59e0b;
  --accent: #f59e0b;
  --accent-foreground: #1a1a2e;
  --muted: #6b7280;
  --muted-foreground: #9ca3af;
  --destructive: #ef4444;
  --destructive-foreground: #fff;
  --success: #22c55e;
  --info: #3b82f6;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}
```

- [ ] **Step 3: Update app/layout.tsx metadata**

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AAPA Tracker",
  description: "Product card tracker for AAPA Store on Uzum marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Run dev server to verify no errors**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: dark background, no console errors.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx
git commit -m "feat(ui): set up dark industrial theme with AAPA color tokens"
```

---

## Self-Review

**Spec coverage:**
- [x] 10-table DB schema — Tasks 3-5
- [x] Drizzle ORM + better-sqlite3 — Tasks 1-2, 6-7
- [x] `/lib/constants.ts` with Uzum rules, enums, stop-word patterns — Task 8
- [x] `/lib/validators.ts` stop-words, media compliance, bilingual check — Task 9
- [x] `/lib/scoring.ts` dual-profile engine (accessories + parts) — Task 10
- [x] Seed data: 5 accessories + 2 parts — Task 11
- [x] Theme setup — Task 12
- [ ] shadcn/ui CLI init — **Gap: not included.** Add to Task 1 or as a new task.

**Gap fix — add shadcn/ui init step to Task 1:**

After the npm installs in Task 1, add:

- [ ] **Step 2b: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

When prompted, choose: Dark theme, CSS variables: yes. This sets up `components/ui/` and updates `tailwind.config.ts`. (Task 12 will then extend rather than replace its output.)

**Placeholder scan:** No TBDs, TODOs, or vague steps found.

**Type consistency:** `ProductDataForScoring` defined in `scoring.ts` and used consistently in `scoring.test.ts`. `ValidationResult` returned consistently from all validator functions.
