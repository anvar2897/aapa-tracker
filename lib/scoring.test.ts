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

  it('yellow for score 50', () => {
    // Title RU(8) + Title UZ(8) + Desc RU(7) + Desc UZ(7) + Short desc(5) + Brand(4) + VAT(2) + Competitor(3) + Price(3) + Use case(6) = 53... let me compute
    // Actually: 8+8+7+7+5+4+2+3+3+6 = 53, color = yellow
    const result = computeScore({
      ...emptyAccessories,
      card: {
        titleRu: 'T', titleUz: 'T', descriptionRu: 'D', descriptionUz: 'D',
        shortDescRu: 'S', brand: 'B', vatPct: 0,
      },
      accessoriesData: { useCaseRu: 'Use case' },
      pricing: { sellingPrice: 10000, competitorPrice: 11000 },
    });
    expect(result.total).toBeGreaterThanOrEqual(50);
    expect(result.total).toBeLessThanOrEqual(69);
    expect(result.color).toBe('yellow');
  });
});
