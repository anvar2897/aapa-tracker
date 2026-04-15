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
