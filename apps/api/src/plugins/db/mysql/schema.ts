import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, unique, serial, varchar, text, timestamp, bigint, tinyint, index, decimal, double, int } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const config = mysqlTable("config", {
	id: serial().notNull(),
	key: varchar({ length: 32 }).notNull(),
	value: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "config_id"}),
	unique("config_key_unique").on(table.key),
	unique("id").on(table.id),
]);

export const customers = mysqlTable("customers", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 64 }).notNull(),
	email: varchar({ length: 64 }),
	phone: varchar({ length: 32 }),
	password: varchar({ length: 255 }),
	weixinOpenId: varchar("weixin_open_id", { length: 64 }),
	alipayOpenId: varchar("alipay_open_id", { length: 64 }),
	status: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "customers_id"}),
	unique("uq_customers_alipay_open_id").on(table.alipayOpenId),
	unique("uq_customers_weixin_open_id").on(table.weixinOpenId),
]);

export const customizationItems = mysqlTable("customization_items", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
	name: varchar({ length: 32 }).notNull(),
	sort: tinyint().notNull(),
	status: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_customization_items_product_id").on(table.productId),
	primaryKey({ columns: [table.id], name: "customization_items_id"}),
]);

export const customizationOptionStoreStatus = mysqlTable("customization_option_store_status", {
	optionId: bigint("option_id", { mode: "number", unsigned: true }).notNull(),
	storeId: bigint("store_id", { mode: "number", unsigned: true }).notNull(),
	status: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.optionId, table.storeId], name: "customization_option_store_status_option_id_store_id"}),
]);

export const customizationOptions = mysqlTable("customization_options", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	itemId: bigint("item_id", { mode: "number", unsigned: true }).notNull(),
	name: varchar({ length: 32 }).notNull(),
	price: decimal({ precision: 10, scale: 2 }).notNull(),
	sort: tinyint().notNull(),
	status: tinyint().notNull(),
	ingredientId: bigint("ingredient_id", { mode: "number", unsigned: true }),
	ingredientQuantity: double("ingredient_quantity"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_customization_options_item_id").on(table.itemId),
	primaryKey({ columns: [table.id], name: "customization_options_id"}),
]);

export const employeeRoles = mysqlTable("employee_roles", {
	employeeId: bigint("employee_id", { mode: "number", unsigned: true }).notNull(),
	roleId: bigint("role_id", { mode: "number", unsigned: true }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.employeeId, table.roleId], name: "employee_roles_employee_id_role_id"}),
]);

export const employees = mysqlTable("employees", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	email: varchar({ length: 128 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	displayName: varchar("display_name", { length: 32 }).notNull(),
	status: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "employees_id"}),
	unique("uq_employees_email").on(table.email),
]);

export const gallery = mysqlTable("gallery", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	url: varchar({ length: 1024 }).notNull(),
	objectKey: varchar("object_key", { length: 512 }).notNull(),
	name: varchar({ length: 32 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "gallery_id"}),
]);

export const ingredients = mysqlTable("ingredients", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	unit: varchar({ length: 50 }).notNull(),
	status: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "ingredients_id"}),
]);

export const menuGroups = mysqlTable("menu_groups", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	menuId: bigint("menu_id", { mode: "number", unsigned: true }).notNull(),
	name: varchar({ length: 32 }).notNull(),
	sort: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "menu_groups_id"}),
]);

export const menuProducts = mysqlTable("menu_products", {
	groupId: bigint("group_id", { mode: "number", unsigned: true }).notNull(),
	productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
	sort: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.groupId, table.productId], name: "menu_products_group_id_product_id"}),
]);

export const menus = mysqlTable("menus", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 32 }).notNull(),
	description: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "menus_id"}),
]);

export const orderItems = mysqlTable("order_items", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
	productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
	productName: varchar("product_name", { length: 64 }).notNull(),
	skuId: varchar("sku_id", { length: 255 }).notNull(),
	customization: text().notNull(),
	coverId: bigint("cover_id", { mode: "number", unsigned: true }),
	quantity: int().notNull(),
	unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
	subtotal: decimal({ precision: 12, scale: 2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_order_items_order_id").on(table.orderId),
	index("idx_order_items_product_id").on(table.productId),
	index("idx_order_items_sku_id").on(table.skuId),
	primaryKey({ columns: [table.id], name: "order_items_id"}),
]);

export const orderStatusLog = mysqlTable("order_status_log", {
	id: serial().notNull(),
	orderId: varchar("order_id", { length: 64 }).notNull(),
	fromStatus: tinyint("from_status").notNull(),
	toStatus: tinyint("to_status").notNull(),
	event: varchar({ length: 64 }).notNull(),
	version: int().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_order_status_log_order_id").on(table.orderId),
	primaryKey({ columns: [table.id], name: "order_status_log_id"}),
	unique("id").on(table.id),
]);

export const orders = mysqlTable("orders", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	orderNo: varchar("order_no", { length: 64 }).notNull(),
	tradeNo: varchar("trade_no", { length: 64 }).notNull(),
	idempotencyKey: varchar("idempotency_key", { length: 64 }).notNull(),
	customerId: bigint("customer_id", { mode: "number", unsigned: true }).notNull(),
	storeId: bigint("store_id", { mode: "number", unsigned: true }).notNull(),
	totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
	totalQuantity: int("total_quantity").notNull(),
	diningMethod: tinyint("dining_method").notNull(),
	note: varchar({ length: 500 }),
	pickupCode: varchar("pickup_code", { length: 10 }),
	makingStatus: tinyint("making_status").notNull(),
	paymentMethod: tinyint("payment_method").notNull(),
	paymentStatus: int("payment_status").notNull(),
	paymentExpiredAt: timestamp("payment_expired_at", { mode: 'string' }).notNull(),
	paymentPaidAt: timestamp("payment_paid_at", { mode: 'string' }),
	paymentRefundedAt: timestamp("payment_refunded_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	version: int().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "orders_id"}),
	unique("uq_orders_idempotency_key").on(table.idempotencyKey),
	unique("uq_orders_order_no").on(table.orderNo),
	unique("uq_orders_trade_no").on(table.tradeNo),
]);

export const permissions = mysqlTable("permissions", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	key: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	note: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "permissions_id"}),
	unique("uq_permissions_key").on(table.key),
]);

export const productImages = mysqlTable("product_images", {
	productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
	imageId: bigint("image_id", { mode: "number", unsigned: true }).notNull(),
	type: tinyint().notNull(),
	sort: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.productId, table.imageId], name: "product_images_product_id_image_id"}),
]);

export const productIngredients = mysqlTable("product_ingredients", {
	productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
	ingredientId: bigint("ingredient_id", { mode: "number", unsigned: true }).notNull(),
	quantity: double().notNull(),
	sort: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.productId, table.ingredientId], name: "product_ingredients_product_id_ingredient_id"}),
]);

export const productStoreStatus = mysqlTable("product_store_status", {
	productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
	storeId: bigint("store_id", { mode: "number", unsigned: true }).notNull(),
	status: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.productId, table.storeId], name: "product_store_status_product_id_store_id"}),
]);

export const productTagMap = mysqlTable("product_tag_map", {
	productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
	tagId: bigint("tag_id", { mode: "number", unsigned: true }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.productId, table.tagId], name: "product_tag_map_product_id_tag_id"}),
]);

export const productTags = mysqlTable("product_tags", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 32 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "product_tags_id"}),
	unique("uq_product_tags_name").on(table.name),
]);

export const products = mysqlTable("products", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 64 }).notNull(),
	brief: varchar({ length: 64 }).notNull(),
	description: varchar({ length: 500 }).notNull(),
	status: tinyint().notNull(),
	price: decimal({ precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "products_id"}),
]);

export const rolePermissions = mysqlTable("role_permissions", {
	roleId: bigint("role_id", { mode: "number", unsigned: true }).notNull(),
	permissionId: bigint("permission_id", { mode: "number", unsigned: true }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.roleId, table.permissionId], name: "role_permissions_role_id_permission_id"}),
]);

export const roles = mysqlTable("roles", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	note: text(),
	status: tinyint().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "roles_id"}),
	unique("uq_roles_name").on(table.name),
]);

export const storeIngredients = mysqlTable("store_ingredients", {
	ingredientId: bigint("ingredient_id", { mode: "number", unsigned: true }).notNull(),
	storeId: bigint("store_id", { mode: "number", unsigned: true }).notNull(),
	quantity: double().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.ingredientId, table.storeId], name: "store_ingredients_ingredient_id_store_id"}),
]);

export const storeMenus = mysqlTable("store_menus", {
	storeId: bigint("store_id", { mode: "number", unsigned: true }).notNull(),
	menuId: bigint("menu_id", { mode: "number", unsigned: true }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.storeId, table.menuId], name: "store_menus_store_id_menu_id"}),
]);

export const stores = mysqlTable("stores", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	province: varchar({ length: 50 }).notNull(),
	city: varchar({ length: 50 }).notNull(),
	district: varchar({ length: 50 }).notNull(),
	address: varchar({ length: 500 }).notNull(),
	status: tinyint().notNull(),
	businessHours: varchar("business_hours", { length: 255 }).notNull(),
	phone: varchar({ length: 50 }).notNull(),
	longitude: double().notNull(),
	latitude: double().notNull(),
	account: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "stores_id"}),
	unique("uq_stores_account").on(table.account),
]);
