CREATE TABLE `config` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `config_id` PRIMARY KEY(`id`),
	CONSTRAINT `config_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`source` tinyint NOT NULL,
	`open_id` varchar(255) NOT NULL,
	`nickname` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_customers_source_openid` UNIQUE(`source`,`open_id`),
	CONSTRAINT `uq_customers_openid` UNIQUE(`open_id`)
);
--> statement-breakpoint
CREATE TABLE `customization_option_store_status` (
	`customization_option_id` bigint unsigned NOT NULL,
	`store_id` bigint unsigned NOT NULL,
	`status` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pk_customization_option_store_status` PRIMARY KEY(`customization_option_id`,`store_id`)
);
--> statement-breakpoint
CREATE TABLE `customization_options` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`customization_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` double NOT NULL,
	`sort` tinyint NOT NULL,
	`status` tinyint NOT NULL,
	`ingredient_id` bigint unsigned,
	`ingredient_quantity` double NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customization_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customizations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`sort` int NOT NULL DEFAULT 0,
	`status` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_roles` (
	`employee_id` bigint unsigned NOT NULL,
	`role_id` bigint unsigned NOT NULL,
	CONSTRAINT `pk_employee_roles` PRIMARY KEY(`employee_id`,`role_id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`display_name` varchar(255) NOT NULL,
	`status` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `gallery_images` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`url` varchar(1024) NOT NULL,
	`object_key` varchar(512) NOT NULL,
	`provider` varchar(64) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_size` int NOT NULL,
	`content_type` varchar(128) NOT NULL,
	`storage_location_id` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gallery_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`status` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_groups` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`menu_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`sort` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_products` (
	`group_id` bigint unsigned NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`sort` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pk_menu_products` PRIMARY KEY(`group_id`,`product_id`)
);
--> statement-breakpoint
CREATE TABLE `menus` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(500) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`order_id` bigint unsigned NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`sku_id` varchar(255) NOT NULL,
	`unit_price` double NOT NULL,
	`quantity` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_order_items_order_sku` UNIQUE(`order_id`,`sku_id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`order_no` varchar(64) NOT NULL,
	`customer_id` bigint unsigned NOT NULL,
	`store_id` bigint unsigned NOT NULL,
	`status` tinyint NOT NULL,
	`price` double NOT NULL,
	`pay_method` tinyint,
	`remark` varchar(500) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`paid_at` timestamp,
	`refunded_at` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_order_no_unique` UNIQUE(`order_no`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`product_id` bigint unsigned NOT NULL,
	`image_id` bigint unsigned NOT NULL,
	`type` tinyint NOT NULL,
	`sort` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pk_product_images` PRIMARY KEY(`product_id`,`image_id`,`type`)
);
--> statement-breakpoint
CREATE TABLE `product_ingredients` (
	`product_id` bigint unsigned NOT NULL,
	`ingredient_id` bigint unsigned NOT NULL,
	`quantity` double NOT NULL,
	`sort` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pk_product_ingredients` PRIMARY KEY(`product_id`,`ingredient_id`)
);
--> statement-breakpoint
CREATE TABLE `product_store_status` (
	`product_id` bigint unsigned NOT NULL,
	`store_id` bigint unsigned NOT NULL,
	`status` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pk_product_store_status` PRIMARY KEY(`product_id`,`store_id`)
);
--> statement-breakpoint
CREATE TABLE `product_tag_map` (
	`product_id` bigint unsigned NOT NULL,
	`tag_id` bigint unsigned NOT NULL,
	CONSTRAINT `pk_product_tag_map` PRIMARY KEY(`product_id`,`tag_id`)
);
--> statement-breakpoint
CREATE TABLE `product_tags` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_tags_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`brief` varchar(500) NOT NULL,
	`description` varchar(2000) NOT NULL,
	`status` tinyint NOT NULL,
	`price` double NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` bigint unsigned NOT NULL,
	`permission_id` bigint unsigned NOT NULL,
	CONSTRAINT `pk_role_permissions` PRIMARY KEY(`role_id`,`permission_id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`note` text,
	`status` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `storage_locations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`region` varchar(255) NOT NULL,
	`endpoint` varchar(512) NOT NULL,
	`bucket` varchar(255) NOT NULL,
	`access_key` varchar(1024) NOT NULL,
	`secret_key` varchar(1024) NOT NULL,
	`force_path_style` tinyint NOT NULL DEFAULT 0,
	`public_base_url` varchar(512) NOT NULL,
	`status` tinyint NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storage_locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `storage_locations_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `store_ingredients` (
	`ingredient_id` bigint unsigned NOT NULL,
	`store_id` bigint unsigned NOT NULL,
	`quantity` double NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pk_store_ingredients` PRIMARY KEY(`ingredient_id`,`store_id`)
);
--> statement-breakpoint
CREATE TABLE `store_menus` (
	`store_id` bigint unsigned NOT NULL,
	`menu_id` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pk_store_menus` PRIMARY KEY(`store_id`,`menu_id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`region_code` varchar(6) NOT NULL,
	`address` varchar(500) NOT NULL,
	`status` tinyint NOT NULL,
	`business_hours` varchar(255) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`longitude` double NOT NULL,
	`latitude` double NOT NULL,
	`account` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`),
	CONSTRAINT `stores_account_unique` UNIQUE(`account`)
);
