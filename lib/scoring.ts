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
  total: number;
  maxPossible: number;
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
