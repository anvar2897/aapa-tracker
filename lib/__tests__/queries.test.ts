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
