// lib/queries.ts
// Server-only: uses Drizzle ORM directly. Never import from client components.

import { eq, desc } from 'drizzle-orm';
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
  boost,
  performance,
} from '@/db/schema';
import { computeScore } from '@/lib/scoring';
import type { ScoreBreakdown } from '@/lib/scoring';
import type {
  Product,
  ProductCard,
  ProductMedia,
  AccessoriesData,
  PartsData,
  Pricing,
  Fulfillment,
  Moderation,
  Boost,
  Performance,
} from '@/db/schema';

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

  const [card] = await db
    .select()
    .from(productCards)
    .where(eq(productCards.productId, id));

  const media = await db
    .select()
    .from(productMedia)
    .where(eq(productMedia.productId, id));

  const [acc] = await db
    .select()
    .from(accessoriesData)
    .where(eq(accessoriesData.productId, id));

  const [parts] = await db
    .select()
    .from(partsData)
    .where(eq(partsData.productId, id));

  const [price] = await db
    .select()
    .from(pricing)
    .where(eq(pricing.productId, id));

  const [ful] = await db
    .select()
    .from(fulfillment)
    .where(eq(fulfillment.productId, id));

  const [mod] = await db
    .select()
    .from(moderation)
    .where(eq(moderation.productId, id));

  const [bst] = await db
    .select()
    .from(boost)
    .where(eq(boost.productId, id));

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

  const total = rows.length;
  const avgScore = Math.round(rows.reduce((s, r) => s + r.score.total, 0) / total);
  const lowScoreCount = rows.filter(r => r.score.total < 50).length;
  const onSaleCount = rows.filter(r => r.status === 'on_sale').length;
  const catalogRevenue = rows.reduce((s, r) => s + (r.sellingPrice ?? 0), 0);

  const distribution = { red: 0, yellow: 0, blue: 0, green: 0 };
  for (const r of rows) {
    const s = r.score.total;
    if (s < 50) distribution.red++;
    else if (s < 70) distribution.yellow++;
    else if (s < 90) distribution.blue++;
    else distribution.green++;
  }

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

  const alerts = rows
    .filter(r => r.score.total < 50)
    .sort((a, b) => a.score.total - b.score.total);

  return { stats: { total, avgScore, lowScoreCount, onSaleCount, catalogRevenue }, distribution, tabCompletion, alerts };
}
