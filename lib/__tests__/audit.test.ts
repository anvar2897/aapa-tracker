import { describe, it, expect } from 'vitest';
import { getAuditData } from '@/lib/queries';

describe('getAuditData', () => {
  it('returns correct shape', async () => {
    const data = await getAuditData();

    expect(Array.isArray(data.critical)).toBe(true);
    expect(Array.isArray(data.high)).toBe(true);
    expect(Array.isArray(data.medium)).toBe(true);
    expect(Array.isArray(data.low)).toBe(true);

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
