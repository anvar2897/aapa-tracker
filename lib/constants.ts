// lib/constants.ts

// Product profiles
export const PRODUCT_PROFILES = ['accessories', 'parts'] as const;
export type ProductProfile = (typeof PRODUCT_PROFILES)[number];

// Fulfillment schemes
export const FULFILLMENT_SCHEMES = ['FBS', 'FBO', 'DBS', 'EDBS'] as const;
export type FulfillmentScheme = (typeof FULFILLMENT_SCHEMES)[number];

// Moderation statuses
export const MODERATION_STATUSES = ['draft', 'ready', 'on_sale', 'blocked', 'archived'] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

// VAT options (Uzbekistan)
export const VAT_OPTIONS = [0, 10, 20] as const;

// FBO turnover thresholds — §5.3 Uzum
export const FBO_TURNOVER_WARN_DAYS = 45;
export const FBO_TURNOVER_CRITICAL_DAYS = 55;
export const FBO_FREE_WINDOW_DAYS = 60;

// Photo compliance rules — §12.3 Uzum
export const PHOTO_MIN_WIDTH_PX = 1080;
export const PHOTO_MIN_HEIGHT_PX = 1440;
export const PHOTO_ASPECT_RATIO = 3 / 4; // width/height
export const PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const VIDEO_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const PHOTO_ASPECT_TOLERANCE = 0.02; // allow ±2% from perfect 3:4

// Minimum counts
export const MIN_PHOTOS = 3;
export const MIN_PROPERTIES = 3;

// Score display thresholds
export const SCORE_RED_MAX = 49;
export const SCORE_YELLOW_MAX = 69;
export const SCORE_BLUE_MAX = 89;
// ≥90 = green

// Uzum stop-word patterns — §8.2 Uzum (no subjective claims, no contact info, no promo)
export const STOP_WORD_PATTERNS: RegExp[] = [
  // Contact info
  /\+?[\d\s\-()]{10,}/,
  /\b\d{2}[-\s]\d{3}[-\s]\d{2}[-\s]\d{2}\b/,
  /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i,
  /https?:\/\//i,
  /telegram|whatsapp|instagram|tiktok/i,
  // Promotional language — using lookaround instead of \b (Cyrillic chars are non-ASCII word chars)
  /(?<![а-яёА-ЯЁa-zA-Z])(лучш(ий|ая|ее|ие)|best)(?![а-яёА-ЯЁa-zA-Z])/i,
  /(?<![а-яёА-ЯЁa-zA-Z])(самый|самая|самое|самые)(?![а-яёА-ЯЁa-zA-Z])\s+(лучш|дешев|дорог)/i,
  /(?<![а-яёА-ЯЁa-zA-Z])супер(?![а-яёА-ЯЁa-zA-Z])|(?<![а-яёА-ЯЁa-zA-Z])super(?![а-яёА-ЯЁa-zA-Z])/i,
  /(?<![а-яёА-ЯЁa-zA-Z])(акция|распродажа|скидка)(?![а-яёА-ЯЁa-zA-Z])/i,
  /(?<![а-яёА-ЯЁa-zA-Z])бесплатн/i,
  /(?<![а-яёА-ЯЁa-zA-Z])гарантир(ован|уем|уется)/i,
  // Misleading quality claims
  /(?<![а-яёА-ЯЁa-zA-Z])(оригинал|original|100%)(?![а-яёА-ЯЁa-zA-Z])/i,
  /(?<![а-яёА-ЯЁa-zA-Z])(люкс|lux|luxury)(?![а-яёА-ЯЁa-zA-Z])/i,
  // Call to action
  /(?<![а-яёА-ЯЁa-zA-Z])закажи(те)?(?![а-яёА-ЯЁa-zA-Z])|(?<![а-яёА-ЯЁa-zA-Z])купи(те)?(?![а-яёА-ЯЁa-zA-Z])|(?<![а-яёА-ЯЁa-zA-Z])звони(те)?(?![а-яёА-ЯЁa-zA-Z])/i,
];

// Accessory subtypes (for UI filters)
export const ACCESSORY_SUBTYPES = [
  'Автохимия',
  'Автокосметика',
  'Чехлы и накидки',
  'Аксессуары для салона',
  'Аксессуары для кузова',
  'Электроника и навигация',
  'Шины и диски',
  'Инструменты',
  'Буксировка и прицепы',
  'Прочее',
] as const;

// Auto part types
export const PART_TYPES = [
  'Двигатель и навесное',
  'Трансмиссия',
  'Ходовая',
  'Тормозная система',
  'Топливная система',
  'Электрика',
  'Кузов и стекло',
  'Фильтры',
  'Охлаждение',
  'Прочее',
] as const;
