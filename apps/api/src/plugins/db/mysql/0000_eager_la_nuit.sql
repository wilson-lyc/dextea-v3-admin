-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `config` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`key` varchar(32) NOT NULL,
	`value` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `config_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `config_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`email` varchar(64),
	`phone` varchar(32),
	`password` varchar(255),
	`weixin_open_id` varchar(64),
	`alipay_open_id` varchar(64),
	`status` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_customers_weixin_open_id` UNIQUE(`weixin_open_id`),
	CONSTRAINT `uq_customers_alipay_open_id` UNIQUE(`alipay_open_id`)
);
--> statement-breakpoint
CREATE TABLE `customization_items` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`name` varchar(32) NOT NULL,
	`sort` tinyint NOT NULL,
	`status` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customization_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customization_option_store_status` (
	`option_id` bigint unsigned NOT NULL,
	`store_id` bigint unsigned NOT NULL,
	`status` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customization_option_store_status_option_id_store_id` PRIMARY KEY(`option_id`,`store_id`)
);
--> statement-breakpoint
CREATE TABLE `customization_options` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`item_id` bigint unsigned NOT NULL,
	`name` varchar(32) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`sort` tinyint NOT NULL,
	`status` tinyint NOT NULL,
	`ingredient_id` bigint unsigned,
	`ingredient_quantity` double,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customization_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_roles` (
	`employee_id` bigint unsigned NOT NULL,
	`role_id` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `employee_roles_employee_id_role_id` PRIMARY KEY(`employee_id`,`role_id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`email` varchar(128) NOT NULL,
	`password` varchar(255) NOT NULL,
	`display_name` varchar(32) NOT NULL,
	`status` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_employees_email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `gallery` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`url` varchar(1024) NOT NULL,
	`object_key` varchar(512) NOT NULL,
	`name` varchar(32) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `gallery_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`status` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_groups` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`menu_id` bigint unsigned NOT NULL,
	`name` varchar(32) NOT NULL,
	`sort` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_products` (
	`group_id` bigint unsigned NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`sort` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_products_group_id_product_id` PRIMARY KEY(`group_id`,`product_id`)
);
--> statement-breakpoint
CREATE TABLE `menus` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	`description` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_ making_status_log` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`from_status` tinyint NOT NULL,
	`to_status` tinyint NOT NULL,
	`event` varchar(64) NOT NULL,
	`version` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `order_ making_status_log_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`order_id` bigint unsigned NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`product_name` varchar(64) NOT NULL,
	`sku_id` varchar(255) NOT NULL,
	`customization` text NOT NULL,
	`cover_url` text,
	`quantity` int NOT NULL,
	`unit_price` decimal(12,2) NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_payment_status_log` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`from_status` tinyint NOT NULL,
	`to_status` tinyint NOT NULL,
	`event` varchar(64) NOT NULL,
	`version` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `order_payment_status_log_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`order_no` varchar(64) NOT NULL,
	`trade_no` varchar(64) NOT NULL,
	`idempotency_key` varchar(64) NOT NULL,
	`customer_id` bigint unsigned NOT NULL,
	`store_id` bigint unsigned NOT NULL,
	`total_price` decimal(12,2) NOT NULL,
	`total_quantity` int NOT NULL,
	`dining_method` tinyint NOT NULL,
	`note` varchar(500),
	`source` tinyint NOT NULL,
	`pickup_code` varchar(10),
	`making_status` tinyint NOT NULL,
	`payment_method` tinyint NOT NULL,
	`payment_status` tinyint NOT NULL,
	`payment_expired_at` timestamp NOT NULL,
	`payment_paid_at` timestamp,
	`payment_refunded_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`version` int NOT NULL,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_orders_order_no` UNIQUE(`order_no`),
	CONSTRAINT `uq_orders_idempotency_key` UNIQUE(`idempotency_key`),
	CONSTRAINT `uq_orders_trade_no` UNIQUE(`trade_no`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_permissions_key` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `pickup_code_counter` (
	`store_id` bigint unsigned NOT NULL,
	`date` timestamp NOT NULL,
	`daily_count` int NOT NULL,
	CONSTRAINT `pickup_code_counter_store_id` PRIMARY KEY(`store_id`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`product_id` bigint unsigned NOT NULL,
	`image_id` bigint unsigned NOT NULL,
	`type` tinyint NOT NULL,
	`sort` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_images_product_id_image_id_type` PRIMARY KEY(`product_id`,`image_id`,`type`)
);
--> statement-breakpoint
CREATE TABLE `product_ingredients` (
	`product_id` bigint unsigned NOT NULL,
	`ingredient_id` bigint unsigned NOT NULL,
	`quantity` double NOT NULL,
	`sort` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_ingredients_product_id_ingredient_id` PRIMARY KEY(`product_id`,`ingredient_id`)
);
--> statement-breakpoint
CREATE TABLE `product_store_status` (
	`product_id` bigint unsigned NOT NULL,
	`store_id` bigint unsigned NOT NULL,
	`status` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_store_status_product_id_store_id` PRIMARY KEY(`product_id`,`store_id`)
);
--> statement-breakpoint
CREATE TABLE `product_tag_map` (
	`product_id` bigint unsigned NOT NULL,
	`tag_id` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `product_tag_map_product_id_tag_id` PRIMARY KEY(`product_id`,`tag_id`)
);
--> statement-breakpoint
CREATE TABLE `product_tags` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_product_tags_name` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`brief` varchar(64) NOT NULL,
	`description` varchar(500) NOT NULL,
	`status` tinyint NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` bigint unsigned NOT NULL,
	`permission_id` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `role_permissions_role_id_permission_id` PRIMARY KEY(`role_id`,`permission_id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`note` text,
	`status` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_roles_name` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `store_ingredients` (
	`ingredient_id` bigint unsigned NOT NULL,
	`store_id` bigint unsigned NOT NULL,
	`quantity` double NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `store_ingredients_ingredient_id_store_id` PRIMARY KEY(`ingredient_id`,`store_id`)
);
--> statement-breakpoint
CREATE TABLE `store_menus` (
	`store_id` bigint unsigned NOT NULL,
	`menu_id` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `store_menus_store_id_menu_id` PRIMARY KEY(`store_id`,`menu_id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`province` varchar(50) NOT NULL,
	`city` varchar(50) NOT NULL,
	`district` varchar(50) NOT NULL,
	`address` varchar(500) NOT NULL,
	`status` tinyint NOT NULL,
	`business_hours` varchar(255) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`longitude` double NOT NULL,
	`latitude` double NOT NULL,
	`account` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_stores_account` UNIQUE(`account`)
);
--> statement-breakpoint
CREATE INDEX `idx_customization_items_product_id` ON `customization_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_customization_options_item_id` ON `customization_options` (`item_id`);--> statement-breakpoint
CREATE INDEX `idx_order_status_log_order_id` ON `order_ making_status_log` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_order_items_order_id` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_order_items_product_id` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_order_items_sku_id` ON `order_items` (`sku_id`);--> statement-breakpoint
CREATE INDEX `idx_order_status_log_order_id` ON `order_payment_status_log` (`order_id`);
*/