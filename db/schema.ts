import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 1. products — root entity
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sku: text('sku').notNull().unique(),
  barcode: text('barcode'),
  productProfile: text('product_profile', { enum: ['accessories', 'parts'] }).notNull(),
  nameRu: text('name_ru').notNull(),
  nameUz: text('name_uz').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// 2. product_cards — all Uzum-required card fields
// properties/characteristics/filter_properties stored as JSON strings
export const productCards = sqliteTable('product_cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  titleRu: text('title_ru'),
  titleUz: text('title_uz'),
  descriptionRu: text('description_ru'),
  descriptionUz: text('description_uz'),
  shortDescRu: text('short_desc_ru'),
  shortDescUz: text('short_desc_uz'),
  // JSON array of strings
  propertiesRu: text('properties_ru'),
  propertiesUz: text('properties_uz'),
  // JSON array of {name_ru, name_uz, value_ru, value_uz}
  characteristics: text('characteristics'),
  // JSON array of {name_ru, name_uz, value_ru, value_uz}
  filterProperties: text('filter_properties'),
  brand: text('brand'),
  vatPct: integer('vat_pct'),
  weightKg: real('weight_kg'),
  dimLengthCm: real('dim_length_cm'),
  dimWidthCm: real('dim_width_cm'),
  dimHeightCm: real('dim_height_cm'),
});

// 3. product_media — photos and videos
// §12.3 Uzum: photos ≥1080×1440, 3:4 ratio, ≤5MB; videos ≤10MB
export const productMedia = sqliteTable('product_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  mediaType: text('media_type', { enum: ['photo', 'video'] }).notNull(),
  widthPx: integer('width_px'),
  heightPx: integer('height_px'),
  sizeBytes: integer('size_bytes'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  orderIndex: integer('order_index').notNull().default(0),
  isCompliant: integer('is_compliant', { mode: 'boolean' }),
  complianceNotes: text('compliance_notes'),
});
