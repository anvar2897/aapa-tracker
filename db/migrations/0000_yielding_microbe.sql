CREATE TABLE `accessories_data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`universal_fit` integer,
	`use_case_ru` text,
	`use_case_uz` text,
	`material_ru` text,
	`material_uz` text,
	`color_options` text,
	`volume_ml` real,
	`application_method_ru` text,
	`application_method_uz` text,
	`kit_contents_ru` text,
	`kit_contents_uz` text,
	`bundle_info` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accessories_data_product_id_unique` ON `accessories_data` (`product_id`);--> statement-breakpoint
CREATE TABLE `boost` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`campaign_type` text,
	`bid_per_1000` real,
	`daily_budget` real,
	`total_budget` real,
	`keywords` text,
	`negative_keywords` text,
	`drr_pct` real,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `boost_product_id_unique` ON `boost` (`product_id`);--> statement-breakpoint
CREATE TABLE `fulfillment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`scheme` text DEFAULT 'FBS' NOT NULL,
	`stock_quantity` integer DEFAULT 0 NOT NULL,
	`fbo_turnover_days` integer,
	`is_oversized` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fulfillment_product_id_unique` ON `fulfillment` (`product_id`);--> statement-breakpoint
CREATE TABLE `moderation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`block_reason` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `moderation_product_id_unique` ON `moderation` (`product_id`);--> statement-breakpoint
CREATE TABLE `parts_data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`oem_number` text,
	`cross_references` text,
	`compatible_models` text,
	`position_ru` text,
	`position_uz` text,
	`part_length_mm` real,
	`part_width_mm` real,
	`part_height_mm` real,
	`part_weight_g` real,
	`warranty_months` integer,
	`material_spec` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parts_data_product_id_unique` ON `parts_data` (`product_id`);--> statement-breakpoint
CREATE TABLE `performance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`date` text NOT NULL,
	`impressions` integer DEFAULT 0 NOT NULL,
	`opens` integer DEFAULT 0 NOT NULL,
	`cart` integer DEFAULT 0 NOT NULL,
	`orders` integer DEFAULT 0 NOT NULL,
	`received` integer DEFAULT 0 NOT NULL,
	`returns` integer DEFAULT 0 NOT NULL,
	`conversion_pct` real,
	`revenue` real,
	`rating` real,
	`reviews` integer,
	`roi_pct` real,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pricing` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`cost_price` real,
	`selling_price` real,
	`discount_price` real,
	`margin_pct` real,
	`competitor_price` real,
	`competitor_url` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pricing_product_id_unique` ON `pricing` (`product_id`);--> statement-breakpoint
CREATE TABLE `product_cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`title_ru` text,
	`title_uz` text,
	`description_ru` text,
	`description_uz` text,
	`short_desc_ru` text,
	`short_desc_uz` text,
	`properties_ru` text,
	`properties_uz` text,
	`characteristics` text,
	`filter_properties` text,
	`brand` text,
	`vat_pct` integer,
	`weight_kg` real,
	`dim_length_cm` real,
	`dim_width_cm` real,
	`dim_height_cm` real,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`url` text NOT NULL,
	`media_type` text NOT NULL,
	`width_px` integer,
	`height_px` integer,
	`size_bytes` integer,
	`is_primary` integer DEFAULT false NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`is_compliant` integer,
	`compliance_notes` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sku` text NOT NULL,
	`barcode` text,
	`product_profile` text NOT NULL,
	`name_ru` text NOT NULL,
	`name_uz` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);