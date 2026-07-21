import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, unique, serial, varchar, text, timestamp, tinyint, bigint, double, int, json } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const config = mysqlTable("config", {
	id: serial().notNull(),
	key: varchar({ length: 255 }).notNull(),
	value: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "config_id"}),
	unique("config_key_unique").on(table.key),
]);

export const customers = mysqlTable("customers", {
	id: serial().notNull(),
	name: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	password: varchar({ length: 255 }),
	platform: tinyint().notNull(),
	weixinOpenId: varchar("weixin_open_id", { length: 255 }),
	alipayOpenId: varchar("alipay_open_id", { length: 255 }),
	status: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "customers_id"}),
	unique("uq_customers_email").on(table.email),
	unique("uq_customers_phone").on(table.phone),
	unique("uq_customers_weixin_open_id").on(table.weixinOpenId),
	unique("uq_customers_alipay_open_id").on(table.alipayOpenId),
]);

export const customizationOptionStoreStatus = mysqlTable("customization_option_store_status", {
	customizationOptionId: bigint("customization_option_id", { mode: "number", unsigned: true }).notNull(),
	storeId: bigint("store_id", { mode: "number", unsigned: true }).notNull(),
	status: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.customizationOptionId, table.storeId], name: "customization_option_store_status_pk"}),
]);

export const customizationOptions = mysqlTable("customization_options", {
	id: serial().notNull(),
	customizationId: bigint("customization_id", { mode: "number", unsigned: true }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	price: double().notNull(),
	sort: tinyint().notNull(),
	status: tinyint().notNull(),
	ingredientId: bigint("ingredient_id", { mode: "number", unsigned: true }),
	ingredientQuantity: double("ingredient_quantity").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "customization_options_id"}),
]);

export const customizations = mysqlTable("customizations", {
	id: serial().notNull(),
	productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	sort: int().notNull(),
	status: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "customizations_id"}),
]);

export const employeeRoles = mysqlTable("employee_roles", {
	employeeId: bigint("employee_id", { mode: "number", unsigned: true }).notNull(),
	roleId: bigint("role_id", { mode: "number", unsigned: true }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.employeeId, table.roleId], name: "employee_roles_employee_id_role_id"}),
]);

export const employees = mysqlTable("employees", {
	id: serial().notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	displayName: varchar("display_name", { length: 255 }).notNull(),
	status: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "employees_id"}),
	unique("employees_email_unique").on(table.email),
]);

export const gallery = mysqlTable("gallery", {
	id: serial().notNull(),
	url: varchar({ length: 1024 }).notNull(),
	objectKey: varchar("object_key", { length: 512 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	name: varchar({ length: 255 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "gallery_id"}),
]);

export const ingredients = mysqlTable("ingredients", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	unit: varchar({ length: 50 }).notNull(),
	status: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "ingredients_id"}),
]);

export const menuGroups = mysqlTable("menu_groups", {
	id: serial().notNull(),
	menuId: bigint("menu_id", { mode: "number", unsigned: true }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	sort: int().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "menu_groups_id"}),
]);

export const menuProducts = mysqlTable("menu_products", {
	groupId: bigint("group_id", { mode: "number", unsigned: true }).notNull(),
	productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
	sort: int().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.groupId, table.productId], name: "menu_products_group_id_product_id"}),
]);

export const menus = mysqlTable("menus", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 500 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "menus_id"}),
]);

export const orderItems = mysqlTable("order_items", {
	id: serial().notNull(),
	orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
	productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
	skuId: varchar("sku_id", { length: 255 }).notNull(),
	unitPrice: double("unit_price").notNull(),
	quantity: int().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "order_items_id"}),
	unique("uq_order_items_order_sku").on(table.orderId, table.skuId),
]);

export const orders = mysqlTable("orders", {
	id: serial().notNull(),
	orderNo: varchar("order_no", { length: 64 }).notNull(),
	customerId: bigint("customer_id", { mode: "number", unsigned: true }).notNull(),
	storeId: bigint("store_id", { mode: "number", unsigned: true }).notNull(),
	status: tinyint().notNull(),
	price: double().notNull(),
	idempotencyKey: varchar("idempotency_key", { length: 64 }).notNull(),
	quantity: int().notNull(),
	payMethod: tinyint("pay_method"),
	tradeNo: varchar("trade_no", { length: 64 }),
	note: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	refundedAt: timestamp("refunded_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "orders_id"}),
	unique("orders_order_no_unique").on(table.orderNo),
]);

export const permissions = mysqlTable("permissions", {
	id: serial().notNull(),
	key: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	note: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "permissions_id"}),
	unique("permissions_key_unique").on(table.key),
]);

export const productImages = mysqlTable("product_images", {
	productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
	imageId: bigint("image_id", { mode: "number", unsigned: true }).notNull(),
	type: tinyint().notNull(),
	sort: int().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.productId, table.imageId, table.type], name: "product_images_product_id_image_id_type"}),
]);

export const productIngredients = mysqlTable("product_ingredients", {
	productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
	ingredientId: bigint("ingredient_id", { mode: "number", unsigned: true }).notNull(),
	quantity: double().notNull(),
	sort: int().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.productId, table.ingredientId], name: "product_ingredients_product_id_ingredient_id"}),
]);

export const productStoreStatus = mysqlTable("product_store_status", {
	productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
	storeId: bigint("store_id", { mode: "number", unsigned: true }).notNull(),
	status: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.productId, table.storeId], name: "product_store_status_product_id_store_id"}),
]);

export const productTagMap = mysqlTable("product_tag_map", {
	productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
	tagId: bigint("tag_id", { mode: "number", unsigned: true }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.productId, table.tagId], name: "product_tag_map_product_id_tag_id"}),
]);

export const productTags = mysqlTable("product_tags", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "product_tags_id"}),
	unique("product_tags_name_unique").on(table.name),
]);

export const products = mysqlTable("products", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	brief: varchar({ length: 500 }).notNull(),
	description: varchar({ length: 2000 }).notNull(),
	status: tinyint().notNull(),
	price: double().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "products_id"}),
]);

export const rolePermissions = mysqlTable("role_permissions", {
	roleId: bigint("role_id", { mode: "number", unsigned: true }).notNull(),
	permissionId: bigint("permission_id", { mode: "number", unsigned: true }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.roleId, table.permissionId], name: "role_permissions_role_id_permission_id"}),
]);

export const roles = mysqlTable("roles", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	note: text(),
	status: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "roles_id"}),
	unique("roles_name_unique").on(table.name),
]);

export const storeIngredients = mysqlTable("store_ingredients", {
	ingredientId: bigint("ingredient_id", { mode: "number", unsigned: true }).notNull(),
	storeId: bigint("store_id", { mode: "number", unsigned: true }).notNull(),
	quantity: double().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.ingredientId, table.storeId], name: "store_ingredients_ingredient_id_store_id"}),
]);

export const storeMenus = mysqlTable("store_menus", {
	storeId: bigint("store_id", { mode: "number", unsigned: true }).notNull(),
	menuId: bigint("menu_id", { mode: "number", unsigned: true }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.storeId, table.menuId], name: "store_menus_store_id_menu_id"}),
]);

export const stores = mysqlTable("stores", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	province: varchar({ length: 50 }).default('').notNull(),
	city: varchar({ length: 50 }).default('').notNull(),
	district: varchar({ length: 50 }).default('').notNull(),
	address: varchar({ length: 500 }).notNull(),
	status: tinyint().notNull(),
	businessHours: varchar("business_hours", { length: 255 }).notNull(),
	phone: varchar({ length: 50 }).notNull(),
	longitude: double().notNull(),
	latitude: double().notNull(),
	account: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "stores_id"}),
	unique("stores_account_unique").on(table.account),
]);
