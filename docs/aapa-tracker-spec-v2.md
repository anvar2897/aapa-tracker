# AAPA Store — Uzum Product Card Tracker
## Claude Code Build Specification v2.0

> **Product mix: 80% Auto Accessories & Care Products / 20% Auto Parts**
> This spec reflects AAPA Store's actual catalog composition.
> All scoring, schema, and UI decisions are tailored accordingly.

---

## 1. PROJECT OVERVIEW

A fullstack web application to track, audit, and optimize all product cards (карточки товаров) for AAPA Store on Uzum marketplace. The app replaces spreadsheets with a purpose-built dashboard that maps directly to Uzum's product card requirements, ranking algorithm, and the specific needs of an auto accessories and care products seller.

**What this app does:**
- Tracks every field Uzum requires for a product card
- Scores each card's optimization level using two different profiles (Accessories vs Parts)
- Flags missing bilingual content, media non-compliance, and ranking-damaging gaps
- Provides a stats dashboard with Uzum's own funnel metrics
- Manages pricing, fulfillment scheme tracking, boost campaigns, and moderation status

---

## 2. TECH STACK

### Core Framework
- **Next.js 14+ (App Router)** — fullstack React framework with file-based routing, server actions, and API routes in one package
- **TypeScript** — strict mode, type safety across the entire codebase
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — accessible, composable component library built on Radix primitives

### Database & ORM
- **SQLite via better-sqlite3** — zero-config, single-file database. No Docker, no Postgres, no server management. Perfect for a solo seller operation. The entire database is one file you back up by copying it.
- **Drizzle ORM** — type-safe SQL queries, lightweight auto-generated migrations

### Charts
- **Recharts** — React-native charting library for dashboard visualizations

### Why This Stack for Claude Code

Claude Code performs best with TypeScript + React — this is its "on-distribution" stack. Approximately 90% of Claude Code itself is built with TypeScript and React. The CLAUDE.md project file gives Claude Code persistent memory of conventions, architecture, and rules across sessions.

Next.js App Router provides file-based routing, server components, server actions, and API routes in one framework. This minimizes the boilerplate Claude Code needs to scaffold and keeps the project structure predictable.

SQLite eliminates all DevOps overhead. No database server to configure, no connection strings, no migrations server. Drizzle ORM gives us type-safe queries that Claude Code generates accurately because it has strong TypeScript inference capabilities.

---

## 3. DATABASE SCHEMA

### 3.1 Table: `products`

The root entity. Every product card starts here.

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `sku` | TEXT UNIQUE | Uzum SKU identifier |
| `barcode` | TEXT | Штрихкод |
| `product_profile` | TEXT NOT NULL | **'accessories'** or **'parts'** — determines which scoring engine and extended data table applies |
| `created_at` | TIMESTAMP | When card was created in tracker |
| `updated_at` | TIMESTAMP | Last edit timestamp |

### 3.2 Table: `product_cards`

Core Uzum-required fields. These are identical regardless of product profile — every product card on Uzum needs these.

| Column | Type | Uzum Requirement | Source |
|---|---|---|---|
| `product_id` | FK → products | — | — |
| `title_ru` | TEXT | ✅ Required | §5.3 — Кириллица. Min 3 words. Formula varies by profile. |
| `title_uz` | TEXT | ✅ Required | §5.3 — Латиница. Must match RU meaning. |
| `category_id` | TEXT | ✅ Required | §5.2 — Use lowest subcategory for better search visibility. |
| `brand` | TEXT | ✅ Required | §5.4 — Must match registered trademark on Uzum. |
| `vat_rate` | INTEGER | ✅ Required | §5.5 — 0% or 12%. Seller liable for incorrect rate. |
| `description_ru` | TEXT | ✅ Required | §5.6 — Rich text, Кириллица. Must reflect real product. |
| `description_uz` | TEXT | ✅ Required | §5.6 — Rich text, Латиница. |
| `short_desc_ru` | TEXT | ✅ Required | §5.8 — 1-2 sentences, Кириллица. |
| `short_desc_uz` | TEXT | ✅ Required | §5.8 — 1-2 sentences, Латиница. |
| `properties_ru` | JSON | ✅ Min 3 | §5.9 — Key-value pairs, Кириллица. |
| `properties_uz` | JSON | ✅ Min 3 | §5.9 — Key-value pairs, Латиница. |
| `characteristics` | JSON | Optional | §5.10 — Variants: color, size, etc. Max 5 groups, 3 unique. Cannot change after first shipment to warehouse. |
| `filter_properties` | JSON | Recommended | §5.16 — Directly affects search visibility. Uzum research: +11% add-to-cart conversion when filled. |
| `weight_kg` | REAL | ✅ Required | §5.17 — ВГХ: weight in package. |
| `length_cm` | REAL | ✅ Required | §5.17 — ВГХ: length in package. |
| `width_cm` | REAL | ✅ Required | §5.17 — ВГХ: width in package. |
| `height_cm` | REAL | ✅ Required | §5.17 — ВГХ: height in package. |

### 3.3 Table: `product_media`

| Column | Type | Uzum Rules (§5.7) |
|---|---|---|
| `product_id` | FK | — |
| `type` | ENUM | 'photo' / 'video' |
| `url` | TEXT | File path or URL |
| `format` | TEXT | Photo: JPEG/JPG/WebP/PNG. Video: MP4 |
| `resolution_ok` | BOOLEAN | Min 1080×1440 |
| `aspect_ratio_ok` | BOOLEAN | Must be 3:4 vertical |
| `size_ok` | BOOLEAN | Photo ≤5MB, Video ≤10MB |
| `is_primary` | BOOLEAN | First photo = front/face of product |
| `sort_order` | INTEGER | Display order (Uzum may reorder) |
| `content_type` | TEXT | 'product_shot' / 'in_use' / 'detail' / 'infographic' / 'size_chart' — for tracking photo diversity |

### 3.4 Table: `accessories_data` (Profile: Accessories & Care — 80% of catalog)

Extended fields specific to accessories and car care products. These don't exist on Uzum as mandatory fields but directly impact conversion, which is 51% of ML ranking weight.

| Column | Type | Purpose |
|---|---|---|
| `product_id` | FK | — |
| `product_subtype` | TEXT | e.g., 'phone_holder', 'seat_cover', 'dash_cam', 'polish', 'shampoo', 'air_freshener', 'organizer', 'led_strip', 'mat', 'steering_cover', 'sun_shade', 'wax', 'glass_cleaner', 'tire_shine', 'microfiber_cloth', 'detailing_kit' |
| `universal_fit` | BOOLEAN | True = works on any vehicle. Most accessories and all care products are universal. |
| `compatible_models` | JSON | Nullable. Only for fitment-specific items like model-specific seat covers or custom mats. Array: [{make, model, year_from, year_to}] |
| `material` | TEXT | Silicone, leather, PU leather, microfiber, plastic, ABS, rubber, etc. |
| `color_options` | JSON | Array of available colors — critical for accessories (buyer browses by look) |
| `kit_contents` | JSON | Nullable. What's included if it's a set/bundle. e.g., ["губка", "полироль 250мл", "салфетка микрофибра"] |
| `volume_ml` | INTEGER | Nullable. For care products: шампунь 500мл, полироль 250мл |
| `application_method` | TEXT | Nullable. For care products: 'spray', 'pour', 'wipe', 'apply_by_hand', 'machine_polish' |
| `use_case_description` | TEXT | When/where/how to use. This is the "scenario" that sells accessories. |
| `country_origin` | TEXT | Страна производитель |
| `warranty_months` | INTEGER | Гарантия |
| `is_bundle` | BOOLEAN | Whether this is sold as a kit/set |
| `bundle_savings_percent` | REAL | Nullable. Discount vs buying items separately — shown in listing to drive AOV |

### 3.5 Table: `parts_data` (Profile: Parts — 20% of catalog)

Extended fields for replacement auto parts where fitment accuracy is critical.

| Column | Type | Purpose |
|---|---|---|
| `product_id` | FK | — |
| `part_type` | TEXT | e.g., 'oil_filter', 'air_filter', 'brake_pads', 'brake_discs', 'belt', 'spark_plug', 'bearing', 'gasket', 'suspension' |
| `oem_number` | TEXT | Original part number. Buyers search by this directly. |
| `cross_references` | JSON | Nullable. Array of alternative OEM numbers from other manufacturers |
| `brand_manufacturer` | TEXT | e.g., Mann Filter, Bosch, Mobis, Parts Mall |
| `compatible_models` | JSON | **Required.** Array: [{make, model, year_from, year_to, engine}] |
| `position` | TEXT | Nullable. 'front', 'rear', 'left', 'right', 'front_left', 'front_right', 'rear_left', 'rear_right' |
| `material` | TEXT | e.g., Ceramic, Semi-metallic, Organic (brake pads), Paper/Synthetic (filters) |
| `dimensions` | JSON | Nullable. Part-specific: {inner_diameter, outer_diameter, height} for filters, {thickness, width, length} for pads |
| `country_origin` | TEXT | Страна производитель |
| `warranty_months` | INTEGER | Гарантия |

### 3.6 Table: `pricing`

| Column | Type | Notes |
|---|---|---|
| `product_id` | FK | — |
| `cost_price` | INTEGER | Себестоимость (сум) |
| `selling_price` | INTEGER | Цена продажи (сум) |
| `discount_price` | INTEGER | Nullable — Акция price |
| `margin_percent` | REAL | Computed: (selling - cost) / cost × 100 |
| `competitor_price` | INTEGER | Nullable — for competitive tracking |
| `competitor_source` | TEXT | Nullable — which competitor (e.g., "FourGreen") |

### 3.7 Table: `fulfillment`

| Column | Type | Options |
|---|---|---|
| `product_id` | FK | — |
| `scheme` | ENUM | 'FBS' / 'FBO' / 'DBS' / 'EDBS' |
| `stock_quantity` | INTEGER | Current inventory |
| `fbo_turnover_days` | INTEGER | Nullable — days on FBO warehouse. Free 0-60 days, costly after. |
| `is_oversized` | BOOLEAN | Крупногабарит — routes to DBS |

### 3.8 Table: `performance`

Snapshot-based for trend analysis. One row per product per date.

| Column | Type | Source (Uzum seller dashboard §7.1, §12) |
|---|---|---|
| `product_id` | FK | — |
| `date` | DATE | Snapshot date |
| `impressions` | INTEGER | Просмотры — times card appeared in search/category |
| `card_opens` | INTEGER | Открыли карточку — clicks into detail |
| `add_to_cart` | INTEGER | Добавили в корзину |
| `orders` | INTEGER | Заказали товаров |
| `received` | INTEGER | Получили товаров — actual deliveries |
| `returns` | INTEGER | Возвраты |
| `conversion_rate` | REAL | orders / impressions × 100 |
| `revenue` | INTEGER | Выручка (сум) |
| `rating` | REAL | Current average rating (SKU-group level) |
| `review_count` | INTEGER | Total reviews |
| `roi` | REAL | (Revenue after commission - cost) / cost × 100 |

### 3.9 Table: `moderation`

| Column | Type | Notes (§5.1, §5.7) |
|---|---|---|
| `product_id` | FK | — |
| `status` | ENUM | 'draft' / 'ready_to_ship' / 'sent' / 'on_sale' / 'out_of_stock' / 'has_issues' / 'blocked' / 'archived' |
| `block_reason` | TEXT | Nullable. e.g., "Фотографии не соответствуют требованиям" |
| `last_checked` | TIMESTAMP | — |

### 3.10 Table: `boost`

| Column | Type | Notes (§11.4 — Буст в ТОП) |
|---|---|---|
| `product_id` | FK | — |
| `campaign_name` | TEXT | — |
| `campaign_type` | TEXT | 'category' / 'search' — placement in category listing or search results |
| `is_active` | BOOLEAN | — |
| `bid_per_1000` | INTEGER | Ставка за 1000 показов (сум). Auction model. |
| `daily_budget` | INTEGER | — |
| `weekly_budget` | INTEGER | Nullable |
| `start_date` | DATE | — |
| `end_date` | DATE | — |
| `keyword_phrases` | JSON | Nullable. For search campaigns: ["масляный фильтр cobalt", "чехол руля"] |
| `negative_keywords` | JSON | Nullable. Минус-слова to exclude |
| `drr` | REAL | Доля расходов на рекламу: ad spend / revenue × 100 |

---

## 4. SCORING ENGINE — DUAL PROFILE SYSTEM

### 4.1 How Scoring Works

Every product card gets a **completion and optimization score from 0 to 100**. This score is never stored — it's always computed fresh from current data. The score answers: "How well is this card positioned to rank, convert, and avoid moderation blocks on Uzum?"

**The scoring engine uses two profiles** because accessories and parts have fundamentally different purchase decision drivers:

- **Accessories buyers** browse visually, compare by looks/features/price, and rarely need fitment. Photos and descriptions sell the product.
- **Parts buyers** search by OEM number or vehicle model, need exact fitment confirmation, and care less about persuasive copy.

The product's `product_profile` field ('accessories' or 'parts') determines which scoring profile applies automatically.

### 4.2 Scoring Sources — Where Each Weight Comes From

Every weight in both profiles traces to one of three sources:

1. **Uzum Hard Requirement** — the seller manual explicitly mandates this field. Missing it = moderation block or card can't go live. These fields get baseline weight regardless of profile.

2. **Uzum Ranking Algorithm** — the manual publishes exact ranking weights:
   - **Linear sorting stage (§12.3):** Rating 81%, Title text match 19%
   - **ML ranking stage (§12.3):** Conversion & purchases 51%, Text relevance 37%, Rating & reviews 7%, Price changes 5%
   - **Filter properties (§5.16):** Uzum's own research shows +11% add-to-cart conversion when filled, +15% add-to-cart from search results

3. **Category Domain Logic** — auto accessories and parts have different buyer behaviors. These weights reflect what drives conversion in each category, and conversion is the #1 ML ranking factor at 51%.

### 4.3 Profile A: Accessories & Care Products (80% of catalog)

| # | Field Check | Weight | Source & Reasoning |
|---|---|---|---|
| 1 | Title RU filled (≥3 words) | 8 | **Uzum Requirement §5.3** + feeds both linear sort (18%) and ML text relevance (37%) |
| 2 | Title UZ filled (≥3 words) | 8 | **Uzum Requirement §5.3** — bilingual mandatory |
| 3 | Description RU filled (≥100 chars) | 7 | **Uzum Requirement §5.6** + **Domain Logic:** accessories sell on benefits and use cases. Buyer needs convincing — description is a conversion driver, and conversion = 51% of ML ranking |
| 4 | Description UZ filled (≥100 chars) | 7 | **Uzum Requirement §5.6** — bilingual parity |
| 5 | Short Description RU/UZ both filled | 5 | **Uzum Requirement §5.8** — card preview in search results, this is the hook |
| 6 | Properties ≥ 3 (RU) | 5 | **Uzum Requirement §5.9** — explicit minimum of 3 |
| 7 | Properties ≥ 3 (UZ) | 5 | **Uzum Requirement §5.9** — bilingual |
| 8 | Filter Properties filled | 8 | **Uzum Ranking §5.16** — Uzum data: +11% cart conversion. For accessories, filters like color, material, type are how buyers narrow choices in browsing. Without these, your product is invisible when buyers use category filters. |
| 9 | Photo count ≥ 3 | 9 | **Uzum Requirement §5.7** (min 1) + **Domain Logic:** accessories are visual purchases. A phone holder needs: product shot, installed-in-car shot, feature closeup. Care products need: bottle shot, application demo, result. **This is the highest-weighted field for accessories** because photos are the #1 conversion driver for visual products, and conversion = 51% of ML ranking. |
| 10 | All photos pass compliance checks | 5 | **Uzum Requirement §5.7** — resolution ≥1080×1440, 3:4 ratio, ≤5MB, product >50% of frame. Failing = moderation block. |
| 11 | Primary photo = front/product view | 3 | **Uzum Requirement §5.7** — first photo must show front of product |
| 12 | Weight/dimensions filled | 3 | **Uzum Requirement §5.17** — ВГХ mandatory for fulfillment |
| 13 | Brand set | 4 | **Uzum Requirement §5.4** — enables filter discovery |
| 14 | VAT rate set | 2 | **Uzum Requirement §5.5** — mandatory, seller liable |
| 15 | Use case / scenario described | 6 | **Domain Logic:** does the description explain when/where/how to use this product? Accessories buyers browse and need to imagine the product in their car. A clear use case scenario ("идеален для дальних поездок", "защищает салон от грязи") converts browsers into buyers. |
| 16 | Video present | 5 | **Uzum Supports §5.7** + **Domain Logic:** care products benefit enormously from demo videos showing application and results. Not mandatory but a strong conversion signal. |
| 17 | Bundle/kit info filled (if applicable) | 4 | **Domain Logic:** accessories and care products are prime bundle candidates. "Полный набор для детейлинга" vs single polish bottle. Bundles increase AOV and differentiate from commodity competitors. If `is_bundle` = true, kit_contents must be filled. |
| 18 | Price set | 3 | **Uzum Requirement** — obviously can't sell without price |
| 19 | Competitor price tracked | 3 | **Uzum Ranking §12.3** — price changes carry 5% ML weight. Accessories are more price-sensitive than parts. Tracking competitors lets you react to price-driven ranking shifts. |
| | **Total** | **100** | |

**Title formula for accessories:**
`Тип товара + Бренд + Ключевая характеристика + Размер/Объем/Количество`
Example: *Автомобильный держатель для телефона Baseus, магнитный, на воздуховод*
Example: *Автошампунь Grass Active Foam, бесконтактный, 1 л*

### 4.4 Profile B: Auto Parts (20% of catalog)

| # | Field Check | Weight | Source & Reasoning |
|---|---|---|---|
| 1 | Title RU filled (≥3 words) | 7 | **Uzum Requirement §5.3** + must follow parts formula |
| 2 | Title UZ filled (≥3 words) | 7 | **Uzum Requirement §5.3** — bilingual |
| 3 | Description RU filled (≥100 chars) | 4 | **Uzum Requirement §5.6** — parts buyers care less about persuasive copy, more about specs |
| 4 | Description UZ filled (≥100 chars) | 4 | **Uzum Requirement §5.6** — bilingual |
| 5 | Short Description RU/UZ both filled | 3 | **Uzum Requirement §5.8** — less critical for parts, buyers go straight to fitment |
| 6 | Properties ≥ 3 (RU) | 4 | **Uzum Requirement §5.9** |
| 7 | Properties ≥ 3 (UZ) | 4 | **Uzum Requirement §5.9** |
| 8 | Filter Properties filled | 5 | **Uzum Ranking §5.16** — important but fitment matters more for parts |
| 9 | Photo count ≥ 3 | 5 | **Uzum Requirement §5.7** — needed but parts are less visual than accessories |
| 10 | All photos pass compliance | 4 | **Uzum Requirement §5.7** — avoids moderation blocks |
| 11 | Primary photo = front view | 2 | **Uzum Requirement §5.7** |
| 12 | Weight/dimensions filled | 4 | **Uzum Requirement §5.17** + parts buyers use dimensions to confirm correct part |
| 13 | Brand set | 4 | **Uzum Requirement §5.4** — trust signal critical for parts (OEM vs aftermarket) |
| 14 | VAT rate set | 2 | **Uzum Requirement §5.5** |
| 15 | OEM number present | 10 | **Domain Logic:** parts buyers search by OEM number directly. This is a high-intent search keyword. Without it, you're invisible to the most ready-to-buy segment. Feeds text relevance (37% of ML ranking). **Second highest weight.** |
| 16 | Compatible models listed (≥1) | 12 | **Domain Logic:** the #1 purchase decision factor for parts. Wrong fitment = return = destroyed conversion signal (51% of ML ranking). A buyer searching "масляный фильтр Cobalt" needs "Cobalt" in your card to even enter the candidate pool at stage 1. **Highest weight in this profile.** |
| 17 | Cross-reference numbers filled | 4 | **Domain Logic:** alternative OEM numbers from other manufacturers. Expands search visibility — a buyer might search by the Bosch number even though you sell the Mann equivalent. |
| 18 | Fitment position specified | 4 | **Domain Logic:** Front/Rear/Left/Right. Prevents wrong-side returns on brake pads, suspension, etc. |
| 19 | Material / technical spec filled | 4 | **Domain Logic:** Ceramic vs semi-metallic, filter media type, etc. Helps buyer confirm correct grade. |
| 20 | Warranty specified | 3 | **Domain Logic:** trust signal for parts purchases. Longer warranty = less perceived risk. |
| 21 | Price set | 3 | **Uzum Requirement** |
| 22 | Part-specific dimensions filled | 3 | **Domain Logic:** inner/outer diameter for filters, pad thickness, etc. Buyer cross-checks against their old part. |
| | **Total** | **100** | |

**Title formula for parts:**
`Тип запчасти + Бренд + Артикул (OEM) + Совместимые модели + Ключ. спецификация`
Example: *Фильтр масляный Mann Filter W914/2 для ВАЗ 2108-2115, Kalina, Granta, Vesta*
Example: *Колодки тормозные передние Sangsin SP1399 для Chevrolet Cobalt, Nexia R3, керамика*

### 4.5 Score Display

| Score Range | Color | Label | Action |
|---|---|---|---|
| 90-100 | Green | Отлично | Listing is fully optimized |
| 70-89 | Blue | Хорошо | Minor improvements possible |
| 50-69 | Amber/Yellow | Требует доработки | Notable gaps affecting ranking |
| 0-49 | Red | Критично | Major issues — likely invisible in search or blocked |

---

## 5. FEATURES & PAGES

### 5.1 Dashboard (Home Page)

**Stats Cards (top row):**
- Total SKUs (breakdown: on sale / draft / blocked / archived)
- Average Card Completion Score (%) — separate for Accessories vs Parts
- Average Rating across all products
- Total Revenue (period selector: 7d / 30d / all)
- Bilingual Coverage (% of cards with both RU + UZ filled across all text fields)
- Photo Compliance Rate (% of cards passing all Uzum media checks)
- Accessories vs Parts split indicator (donut chart showing 80/20 or current ratio)

**Charts:**
- **Conversion Funnel** (Uzum's model §7.1): Impressions → Card Opens → Add to Cart → Orders → Received (horizontal bar chart)
- **Revenue Trend**: line chart, daily/weekly toggle
- **Fulfillment Distribution**: pie chart — FBS vs FBO vs DBS count
- **Top 5 Products by Orders**: horizontal bar, with profile badge (A/P)
- **Bottom 5 Products by Conversion**: red-flagged for optimization, with specific diagnostic
- **Score Distribution Histogram**: how many cards in each score band (0-49, 50-69, 70-89, 90-100)

**Quick Alerts Panel (sorted by urgency):**
- 🔴 Blocked/issues cards needing attention (moderation failures)
- 🔴 Cards missing Uzbek translation (can't go live without bilingual)
- 🟡 Cards with < 3 properties (below Uzum minimum)
- 🟡 Cards with no filter properties (losing search visibility — Uzum shows -11% cart conversion)
- 🟡 Accessories cards with < 3 photos (visual products need multiple angles)
- 🟡 Parts cards with no compatible models listed (fitment gap = return risk)
- 🟡 Products with 0 reviews (need review acquisition strategy)
- 🟠 FBO items approaching 60-day turnover warning (free storage window ending)
- 🔵 Care products with no video (opportunity — not critical)
- 🔵 Bundle-tagged items with empty kit_contents (incomplete listing)

### 5.2 Product Cards List

**Table columns:**
Thumbnail | SKU | Title (RU) | Profile (A/P badge) | Category | Price | Stock | Fulfillment | Rating | Reviews | Conversion % | Score | Status | Actions

**Filters:**
- By product profile (Accessories / Parts / All)
- By moderation status
- By fulfillment scheme
- By completion score range (slider)
- By category
- By boost active/inactive
- By score band (Red / Yellow / Blue / Green)
- Search by title, SKU, OEM number, barcode

**Sort options:**
- Score (low→high for optimization priority)
- Revenue (high→low)
- Conversion rate
- Rating
- Date created
- Stock quantity

**Bulk actions:**
- Export selected to CSV
- Bulk update fulfillment scheme
- Bulk update prices (mirrors Uzum's own bulk price update flow from §5.15)

### 5.3 Product Card Detail / Editor

**Profile selector at top** — sets 'accessories' or 'parts', which determines:
- Which scoring profile is used
- Which extended data tab appears (Tab 2a or Tab 2b)
- Which title formula guide is shown
- Which fields are highlighted as high-priority

**Live score indicator** — always visible in header, updates as fields are filled. Shows the weighted breakdown: "Score: 74/100 — Missing: Video (+5), Use case (+6), 1 more photo (+9)"

**Tabbed layout:**

---

**Tab 1 — Content (Контент)**

- Title RU / UZ (side-by-side editors with character count)
- Title formula guide shown inline based on profile:
  - Accessories: `Тип товара + Бренд + Ключевая характеристика + Размер/Объем`
  - Parts: `Тип запчасти + Бренд + Артикул + Совместимые модели + Спецификация`
- Short Description RU / UZ (side-by-side, 1-2 sentences each)
- Full Description RU / UZ (rich text editors, side-by-side)
- **Stop-words validator**: real-time check against Uzum's banned content (§5.3):
  - Flags subjective words ("лучший", "самый дешёвый", "оригинал")
  - Flags contact info, URLs, promotional claims
  - Flags CapsLock usage, excessive punctuation
  - Flags mixed-language text (only RU in RU field, only UZ in UZ field)
- Real-time bilingual completion indicator (green checkmarks per field pair)

---

**Tab 2a — Accessories Data (for profile = 'accessories')**

- Product subtype selector (dropdown: phone holder, seat cover, dash cam, polish, shampoo, etc.)
- Universal fit toggle (default: ON for most accessories and all care products)
- Compatible models table (only visible if universal_fit = OFF) — Make / Model / Year
- Material input
- Color options (tag input — add multiple)
- **Use Case Description** (textarea) — when/where/how to use. Highlighted as high-priority field (weight: 6)
- Volume (ml) — for care products
- Application method — for care products (dropdown: spray, pour, wipe, etc.)
- Country of origin
- Warranty (months)
- **Bundle section:**
  - Is Bundle toggle
  - Kit Contents (editable list: item name + quantity)
  - Bundle savings % vs buying separately

---

**Tab 2b — Parts Fitment Data (for profile = 'parts')**

- Part type selector (dropdown: oil filter, air filter, brake pads, belt, spark plug, etc.)
- OEM Number input — **highlighted as critical field (weight: 10)**
- Cross-reference numbers (tag input — add multiple alternative OEM numbers)
- Compatible vehicles table — **highlighted as critical field (weight: 12)**:
  - Columns: Make / Model / Year From / Year To / Engine
  - Add/remove rows
  - Bulk paste from spreadsheet
- Position selector (Front / Rear / Left / Right / combinations)
- Material selector (Ceramic, Semi-metallic, Paper, Synthetic, etc.)
- Part-specific dimensions: configurable fields based on part_type
  - Filters: inner diameter, outer diameter, height
  - Brake pads: thickness, width, length
  - Belts: length, width, number of ribs
- Country of origin
- Warranty (months)

---

**Tab 3 — Media (Фото и Видео)**

- Photo grid with per-image compliance badges:
  - ✅/❌ Resolution ≥ 1080×1440
  - ✅/❌ Aspect ratio 3:4 vertical
  - ✅/❌ Size ≤ 5MB
  - ✅/❌ Product occupies > 50% of frame (manual check toggle)
  - ✅/❌ No prohibited content flags (manual check toggle)
- **Photo type tags** (for tracking diversity):
  - Product shot (основное фото)
  - In-use / installed (в использовании)
  - Detail / closeup (детали)
  - Infographic (инфографика — factual info only per §5.7)
  - Size/spec chart (размерная сетка — cannot be only image)
- Primary photo indicator (must be front view, highlighted)
- Video upload slot (MP4, ≤10MB, 3:4)
- **Photo count indicator**: "3/3 minimum" with profile-specific note:
  - Accessories: "Visual products perform best with 5+ photos including in-use shots"
  - Parts: "Include part number label closeup and installed position photo"
- Drag-to-reorder (note: Uzum may reorder per §5.7)

---

**Tab 4 — Properties & Characteristics (Свойства и Характеристики)**

- **Properties editor** (§5.9):
  - Two-column layout: RU key-value | UZ key-value
  - Minimum 3 required (counter shown)
  - Suggested properties based on product subtype/part type
  - e.g., Accessories: Материал, Размер, Цвет, Вес, Страна производитель
  - e.g., Parts: Артикул, Материал, Размер, Тип, Совместимость

- **Characteristics editor** (§5.10):
  - Variant groups (max 5 groups, 3 can be unique)
  - Standard groups: Color (linked to photos), Size
  - Custom groups: Volume, Model, Connector type, etc.
  - Warning: "Groups cannot be changed after first shipment to warehouse"
  - Each combination gets its own SKU and barcode

- **Filter Properties** (§5.16):
  - Category-specific checklist
  - Highlighted as high-priority: "+11% cart conversion when filled (Uzum data)"
  - "Without these, your product won't appear when buyers use category filters"

---

**Tab 5 — Pricing (Цены)**

- Cost price (себестоимость, сум)
- Selling price (цена продажи, сум)
- Discount price (nullable — акция)
- Auto-calculated margin %
- Competitor price field + competitor name (e.g., "FourGreen: 185,000 сум")
- Price history log (date / old price / new price)
- Warning if margin < 15% (typical marketplace minimum viable margin)
- Note from Uzum ranking (§12.3): "Price decreases boost ranking position (5% ML weight)"

---

**Tab 6 — Fulfillment (Логистика)**

- Scheme selector: FBS / FBO / DBS / EDBS
  - FBS: "Start here — test SKU performance"
  - FBO: "For proven sellers — storefront priority, but costly if turnover > 60 days"
  - DBS: "For oversized items — bumpers, engines, large accessories"
  - EDBS: "Requires separate legal entity"
- Current stock quantity
- FBO turnover tracker:
  - Days counter since arriving at warehouse
  - Green (0-45 days) → Yellow (45-55 days) → Red (55+ days)
  - "Free storage: 0-60 days. Storage fees apply after 60 days."
- Oversized flag toggle (auto-suggest DBS if checked)

---

**Tab 7 — Performance (Аналитика)**

- **Uzum funnel visualization** (mirrors §7.1 dashboard):
  Impressions → Card Opens → Add to Cart → Orders → Received
  With conversion % between each step

- Rating + review count display
- ROI calculation
- Revenue trend (mini sparkline chart, last 30 days)

- **Diagnostic alerts** (based on Uzum's own guidance from Буст в ТОП §11.4):
  - ⚠️ High impressions, low card opens → "Fix main photo, title, or price — these are what buyers see in search results"
  - ⚠️ High card opens, low add to cart → "Fix remaining photos, description, review quality, or price attractiveness"
  - ⚠️ High cart, low received orders → "Possible quality mismatch, fitment issue, or defective batch — check returns"

- Return rate tracker + return reasons if available

---

**Tab 8 — Boost & Promotion (Продвижение)**

- Campaign type: Category boost vs Search boost
- Active campaign details
- Bid per 1000 impressions (сум)
- Keyword phrases (for search campaigns)
- Negative keywords (минус-слова)
- Budget: daily and weekly
- Campaign metrics: impressions, clicks, cart adds, orders, received, conversion, revenue, spend
- DRR tracking (ad spend / revenue × 100)
- "Average cost per sale" metric
- Campaign status: Planned / Active / Paused / Budget reached / Completed

---

### 5.4 Audit Report Page

One-click catalog-wide audit. Generates a prioritized action list.

**Critical (moderation risk):**
- Cards with 'blocked' or 'has_issues' status + block reason
- Cards missing any mandatory bilingual field
- Cards with non-compliant photos

**High Priority (ranking damage):**
- Cards below 50% completion score
- Parts cards with no compatible models (return risk)
- Cards with no filter properties (invisible in filtered search)
- Cards with 0 reviews (sorted by days since listing)

**Medium Priority (optimization):**
- Accessories cards with < 3 photos
- Accessories cards with no use case description
- Cards without video (especially care products)
- Bundles with empty kit_contents
- Parts cards missing OEM number

**Low Priority (monitoring):**
- FBO items approaching 60-day window
- Products with declining conversion trend
- Price competitiveness warnings (if competitor price tracked)

Exportable as CSV.

### 5.5 Import / Export

- **CSV Import**: bulk-create product cards from spreadsheet. Template includes all fields with column headers in both English and Russian for usability.
- **CSV Export**: full catalog export with all fields, filterable by profile.
- **Template CSVs**: separate templates for Accessories and Parts profiles, pre-filled with example data and field descriptions.

---

## 6. CLAUDE.md — PROJECT CONFIGURATION FILE

This is the file Claude Code reads at the start of every session.

```markdown
# AAPA Tracker — CLAUDE.md

## Project Purpose
Product card tracker for AAPA Store on Uzum marketplace (Uzbekistan).
80% auto accessories & care products, 20% auto parts.
All product cards must be bilingual: Russian (Cyrillic) + Uzbek (Latin).

## Tech Stack
- Next.js 14+ (App Router, TypeScript strict mode)
- Tailwind CSS + shadcn/ui (Radix primitives)
- SQLite via better-sqlite3 (single-file database in /data/aapa-tracker.db)
- Drizzle ORM (schema in /db/schema.ts)
- Recharts (dashboard charts)

## Architecture
```
/app
  /dashboard           — main stats page (server component + client charts)
  /products            — product list with filters, sort, bulk actions
  /products/new        — new card creator (profile selector first)
  /products/[id]       — detail/editor (8 tabbed sections)
  /products/[id]/edit  — edit mode
  /audit               — catalog-wide audit report
  /import              — CSV import/export
  /api                 — API routes (only if server actions insufficient)
/components
  /ui                  — shadcn/ui primitives (do not modify these)
  /dashboard           — stat cards, charts, alerts panel, funnel
  /product             — card editor tabs, completion badge, score ring
  /common              — layout shell, sidebar nav, search bar, profile badge
/db
  schema.ts            — Drizzle schema (all 10 tables)
  migrations/          — auto-generated by Drizzle
  seed.ts              — sample data: 5 accessories + 2 parts cards
/lib
  scoring.ts           — dual-profile scoring engine (accessories vs parts)
  validators.ts        — stop-words checker, media compliance, bilingual check
  constants.ts         — Uzum rules, fulfillment schemes, part types, accessory subtypes
  diagnostics.ts       — funnel diagnostic logic (high impressions + low opens = photo/title issue, etc.)
```

## Code Conventions
- TypeScript strict mode, no `any` types
- All components in /components with PascalCase filenames
- Server actions in /app/actions/ (preferred over API routes)
- Use Drizzle's type-safe query builder, never raw SQL strings
- All text content supports bilingual (RU/UZ) — never hardcode single-language fields
- Use CSS variables from shadcn/ui theme, extend with custom tokens in globals.css
- Comments in English, UI labels in Russian (primary user language)

## Key Business Rules
- Every product card MUST have a `product_profile` ('accessories' or 'parts')
- Completion score is ALWAYS computed, never stored — derived from current field state
- Two scoring profiles exist — the system auto-selects based on product_profile
- Photo compliance checks run on metadata only (resolution, size, aspect ratio)
- Accessories: photos are the #1 conversion driver — weight 9/100
- Parts: compatible_models is the #1 field — weight 12/100
- FBO turnover warning at 45 days, critical at 55 days (free window = 60 days)
- Stop-words validation runs against Uzum's published banned patterns (no subjective claims, no contact info, no promotional language)
- All Uzum manual section references (§5.3, §12.3, etc.) are preserved in code comments for traceability

## Design Direction
Aesthetic: Industrial-utilitarian dashboard. Dark mode primary.
Think automotive diagnostic tool, not generic SaaS.
- Base: Dark charcoal (#1a1a2e)
- Accent: Electric amber (#f59e0b) for CTAs and highlights
- Cards: Steel gray (#374151)
- Danger: Red (#ef4444)
- Success: Green (#22c55e)
- Info: Blue (#3b82f6)
- Typography: JetBrains Mono for data/numbers, system sans-serif for UI
- Profile badges: Amber "A" for accessories, Blue "P" for parts
```

---

## 7. DEPLOYMENT

For a solo seller operation:

- **Local dev**: `npm run dev` — instant start, no services to boot
- **Production**: Deploy to Vercel (free tier handles this) or any VPS with `npm run build && npm start`
- **Database**: SQLite file at `/data/aapa-tracker.db` — back up by copying this single file. No database server, no connection strings.
- **No Docker required. No external database. No DevOps overhead.**

---

## 8. FUTURE EXTENSIONS

Listed in priority order based on AAPA Store roadmap:

1. **AI Description Generator** — Claude API call to generate bilingual descriptions from product specs. Input: product type + brand + key features. Output: description RU + UZ + short description RU + UZ.

2. **Uzum Seller Dashboard Data Sync** — when Uzum opens seller API or provides CSV exports, auto-import performance data (impressions, orders, revenue, ratings) instead of manual entry.

3. **Competitor Price Monitor** — periodic scraping of FourGreen and other competitors in avtotovary category on Uzum. Alert when competitor undercuts your price.

4. **Telegram Bot Alerts** — push notifications for: moderation blocks, FBO turnover warnings approaching 60 days, stock running low, 0-review products aging past 14 days.

5. **Bundle Optimizer** — analyze sales data to suggest which accessories and care products to bundle together based on co-purchase patterns.

6. **Multi-user Auth** — add login if team grows beyond solo operation. Role-based: Owner (full access), Manager (edit cards), Viewer (read-only dashboard).

7. **EDBS Integration** — when separate legal entity is established, add EDBS-specific fields and cost calculations per §3.2.1.
