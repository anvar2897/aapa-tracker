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
      heightPx: 1080,
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
