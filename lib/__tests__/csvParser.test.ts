import { describe, it, expect } from 'vitest';
import { parseCsvImport } from '@/lib/csvParser';

const HEADER = 'sku,barcode,productProfile,nameRu,nameUz';

describe('parseCsvImport', () => {
  it('parses a valid accessories row', () => {
    const csv = `${HEADER}\nACC-TEST,,accessories,Тест RU,Test UZ`;
    const result = parseCsvImport(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0]).toEqual({
      sku: 'ACC-TEST',
      barcode: undefined,
      productProfile: 'accessories',
      nameRu: 'Тест RU',
      nameUz: 'Test UZ',
    });
  });

  it('parses a valid parts row with barcode', () => {
    const csv = `${HEADER}\nPRT-TEST,1234567890,parts,Деталь RU,Detal UZ`;
    const result = parseCsvImport(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.valid[0].barcode).toBe('1234567890');
    expect(result.valid[0].productProfile).toBe('parts');
  });

  it('reports error for missing sku', () => {
    const csv = `${HEADER}\n,,accessories,Тест RU,Test UZ`;
    const result = parseCsvImport(csv);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(2);
    expect(result.errors[0].message).toMatch(/sku/i);
  });

  it('reports error for invalid productProfile', () => {
    const csv = `${HEADER}\nTEST-1,,gadgets,Тест RU,Test UZ`;
    const result = parseCsvImport(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/productProfile/i);
  });

  it('reports error for missing nameRu', () => {
    const csv = `${HEADER}\nTEST-1,,accessories,,Test UZ`;
    const result = parseCsvImport(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/nameRu/i);
  });

  it('reports error for missing nameUz', () => {
    const csv = `${HEADER}\nTEST-1,,accessories,Тест RU,`;
    const result = parseCsvImport(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/nameUz/i);
  });

  it('skips blank lines', () => {
    const csv = `${HEADER}\nACC-1,,accessories,A RU,A UZ\n\nACC-2,,accessories,B RU,B UZ`;
    const result = parseCsvImport(csv);
    expect(result.valid).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it('returns empty when only header present', () => {
    const result = parseCsvImport(HEADER);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('handles quoted values with commas', () => {
    const csv = `${HEADER}\nACC-1,,"accessories","Тест, с запятой",Test UZ`;
    const result = parseCsvImport(csv);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].nameRu).toBe('Тест, с запятой');
  });
});
