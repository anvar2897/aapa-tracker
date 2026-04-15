import { describe, it, expect, afterAll, vi } from 'vitest';
import { createProduct } from '@/app/actions/products';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Mock revalidatePath for tests
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const createdSkus: string[] = [];

afterAll(async () => {
  for (const sku of createdSkus) {
    await db.delete(products).where(eq(products.sku, sku));
  }
});

describe('createProduct', () => {
  it('creates an accessories product with fulfillment+moderation rows', async () => {
    const sku = `TEST-ACC-${Date.now()}`;
    createdSkus.push(sku);
    const result = await createProduct({
      sku, productProfile: 'accessories', nameRu: 'Тестовый товар', nameUz: 'Test mahsulot',
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
