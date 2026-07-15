CREATE TABLE `product_images` (
	`product_id` bigint unsigned NOT NULL,
	`image_id` bigint unsigned NOT NULL,
	`type` tinyint NOT NULL,
	`sort` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pk_product_images` PRIMARY KEY(`product_id`,`image_id`,`type`)
);
