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
    if (media.widthPx != null && media.heightPx != null && media.heightPx !== 0) {
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
