'use server';

import { eq, inArray } from 'drizzle-orm';
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

    if (data.isPrimary) {
      await db.update(productMedia)
        .set({ isPrimary: false })
        .where(eq(productMedia.productId, productId));
    }

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

export async function bulkUpdateStatus(
  ids: number[],
  status: 'draft' | 'ready' | 'on_sale' | 'blocked' | 'archived',
): Promise<ActionResult<{ updatedCount: number }>> {
  if (ids.length === 0) return { updatedCount: 0 };
  try {
    await db.update(moderation)
      .set({ status })
      .where(inArray(moderation.productId, ids));
    revalidatePath('/products');
    return { updatedCount: ids.length };
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
