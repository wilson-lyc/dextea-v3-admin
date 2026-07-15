import {
  mysqlTable,
  serial,
  varchar,
  tinyint,
  timestamp,
  bigint,
  text,
  double,
  int,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';

/** 员工表 */
export const employeesTable = mysqlTable('employees', {
  id: serial().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  status: tinyint().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/** 角色表 */
export const rolesTable = mysqlTable('roles', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  note: text(),
  status: tinyint().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/** 权限表 */
export const permissionsTable = mysqlTable(
  'permissions',
  {
    id: serial().primaryKey(),
    key: varchar({ length: 255 }).notNull().unique(),
    name: varchar({ length: 255 }).notNull(),
    note: text(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
);

/** 员工-角色关联表 */
export const employeeRolesTable = mysqlTable(
  'employee_roles',
  {
    employeeId: bigint('employee_id', { mode: 'number', unsigned: true }).notNull(),
    roleId: bigint('role_id', { mode: 'number', unsigned: true }).notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_employee_roles',
      columns: [table.employeeId, table.roleId],
    }),
  }),
);

/** 角色-权限关联表 */
export const rolePermissionsTable = mysqlTable(
  'role_permissions',
  {
    roleId: bigint('role_id', { mode: 'number', unsigned: true }).notNull(),
    permissionId: bigint('permission_id', { mode: 'number', unsigned: true }).notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_role_permissions',
      columns: [table.roleId, table.permissionId],
    }),
  }),
);

/** 配置表 */
export const configTable = mysqlTable('config', {
  id: serial().primaryKey(),
  key: varchar({ length: 255 }).notNull().unique(),
  value: text().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/** 门店表 */
export const storesTable = mysqlTable('stores', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  regionCode: varchar('region_code', { length: 6 }).notNull(),
  address: varchar({ length: 500 }).notNull(),
  status: tinyint().notNull(),
  businessHours: varchar('business_hours', { length: 255 }).notNull(),
  phone: varchar({ length: 50 }).notNull(),
  longitude: double().notNull(),
  latitude: double().notNull(),
  account: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/** 门店-菜单关联表 */
export const storeMenusTable = mysqlTable(
  'store_menus',
  {
    storeId: bigint('store_id', { mode: 'number', unsigned: true }).notNull(),
    menuId: bigint('menu_id', { mode: 'number', unsigned: true }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_store_menus',
      columns: [table.storeId, table.menuId],
    }),
  }),
);

/** 商品表 */
export const productsTable = mysqlTable('products', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  brief: varchar('brief', { length: 500 }).notNull(),
  description: varchar({ length: 2000 }).notNull(),
  status: tinyint().notNull(),
  price: double().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/** 商品标签表 */
export const productTagsTable = mysqlTable('product_tags', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/** 商品-标签关联表 */
export const productTagMapTable = mysqlTable(
  'product_tag_map',
  {
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    tagId: bigint('tag_id', { mode: 'number', unsigned: true }).notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_product_tag_map',
      columns: [table.productId, table.tagId],
    }),
  }),
);

/** 客制化项目表 */
export const customizationsTable = mysqlTable('customizations', {
  id: serial().primaryKey(),
  productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  sort: int('sort').notNull().default(0),
  status: tinyint().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/** 客制化选项表 */
export const customizationOptionsTable = mysqlTable('customization_options', {
  id: serial().primaryKey(),
  customizationId: bigint('customization_id', { mode: 'number', unsigned: true }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  price: double().notNull(),
  sort: tinyint().notNull(),
  status: tinyint().notNull(),
  ingredientId: bigint('ingredient_id', { mode: 'number', unsigned: true }),
  ingredientQuantity: double('ingredient_quantity').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/** 原料表 */
export const ingredientsTable = mysqlTable('ingredients', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  unit: varchar({ length: 50 }).notNull(),
  status: tinyint().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/** 商品-原料关联表 */
export const productIngredientsTable = mysqlTable(
  'product_ingredients',
  {
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    ingredientId: bigint('ingredient_id', { mode: 'number', unsigned: true }).notNull(),
    quantity: double().notNull(),
    sort: int('sort').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_product_ingredients',
      columns: [table.productId, table.ingredientId],
    }),
  }),
);

/** 商品-门店状态表 */
export const productStoreStatusTable = mysqlTable(
  'product_store_status',
  {
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    storeId: bigint('store_id', { mode: 'number', unsigned: true }).notNull(),
    status: tinyint().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_product_store_status',
      columns: [table.productId, table.storeId],
    }),
  }),
);

/** 商品图片关联表（封面图 / 图库统一存放，type 区分类型） */
export const productImagesTable = mysqlTable(
  'product_images',
  {
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    imageId: bigint('image_id', { mode: 'number', unsigned: true }).notNull(),
    /** 图片类型：1=封面图 2=图库（见 @dextea-admin/contracts PRODUCT_IMAGE_TYPE） */
    type: tinyint('type').notNull(),
    /** 排序（图库按此字段升序展示） */
    sort: int('sort').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_product_images',
      columns: [table.productId, table.imageId, table.type],
    }),
  }),
);

/** 客制化选项-门店状态表 */
export const customizationOptionStoreStatusTable = mysqlTable(
  'customization_option_store_status',
  {
    customizationOptionId: bigint('customization_option_id', { mode: 'number', unsigned: true }).notNull(),
    storeId: bigint('store_id', { mode: 'number', unsigned: true }).notNull(),
    status: tinyint().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_customization_option_store_status',
      columns: [table.customizationOptionId, table.storeId],
    }),
  }),
);

/** 原料-门店库存表 */
export const storeIngredientsTable = mysqlTable(
  'store_ingredients',
  {
    ingredientId: bigint('ingredient_id', { mode: 'number', unsigned: true }).notNull(),
    storeId: bigint('store_id', { mode: 'number', unsigned: true }).notNull(),
    quantity: double().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_store_ingredients',
      columns: [table.ingredientId, table.storeId],
    }),
  }),
);

/** 菜单表 */
export const menusTable = mysqlTable('menus', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/** 菜单分组表 */
export const menuGroupsTable = mysqlTable('menu_groups', {
  id: serial().primaryKey(),
  menuId: bigint('menu_id', { mode: 'number', unsigned: true }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  sort: int('sort').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/** 菜单商品关联表 */
export const menuProductsTable = mysqlTable(
  'menu_products',
  {
    groupId: bigint('group_id', { mode: 'number', unsigned: true }).notNull(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    sort: int('sort').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_menu_products',
      columns: [table.groupId, table.productId],
    }),
  }),
);

/** 顾客表 */
export const customersTable = mysqlTable(
  'customers',
  {
    id: serial().primaryKey(),
    source: tinyint().notNull(),
    openId: varchar('open_id', { length: 255 }).notNull(),
    nickname: varchar({ length: 255 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    uniqueOpenIdPerSource: uniqueIndex('uq_customers_source_openid').on(table.source, table.openId),
    uniqueOpenId: uniqueIndex('uq_customers_openid').on(table.openId),
  }),
);

/** 订单表 */
export const ordersTable = mysqlTable('orders', {
  id: serial().primaryKey(),
  orderNo: varchar('order_no', { length: 64 }).notNull().unique(),
  customerId: bigint('customer_id', { mode: 'number', unsigned: true }).notNull(),
  storeId: bigint('store_id', { mode: 'number', unsigned: true }).notNull(),
  status: tinyint().notNull(),
  price: double('price').notNull(),
  payMethod: tinyint('pay_method'),
  remark: varchar({ length: 500 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  paidAt: timestamp('paid_at', { mode: 'string' }),
  refundedAt: timestamp('refunded_at', { mode: 'string' }),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/** 订单详情表 */
export const orderItemsTable = mysqlTable(
  'order_items',
  {
    id: serial().primaryKey(),
    orderId: bigint('order_id', { mode: 'number', unsigned: true }).notNull(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    skuId: varchar('sku_id', { length: 255 }).notNull(),
    unitPrice: double('unit_price').notNull(),
    quantity: int().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    uniqueOrderSku: uniqueIndex('uq_order_items_order_sku').on(table.orderId, table.skuId),
  }),
);

/** 图片资源表 */
export const galleryImagesTable = mysqlTable('gallery_images', {
  id: serial().primaryKey(),
  url: varchar('url', { length: 1024 }).notNull(),
  objectKey: varchar('object_key', { length: 512 }).notNull(),
  storageLocationId: bigint('storage_location_id', { mode: 'number', unsigned: true }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

/** 存储位置表 */
export const storageLocationsTable = mysqlTable('storage_locations', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  provider: varchar('provider', { length: 64 }).notNull().default('tencent'),
  region: varchar('region', { length: 255 }).notNull(),
  endpoint: varchar('endpoint', { length: 512 }).notNull(),
  bucket: varchar('bucket', { length: 255 }).notNull(),
  accessKey: varchar('access_key', { length: 1024 }).notNull(),
  secretKey: varchar('secret_key', { length: 1024 }).notNull(),
  forcePathStyle: tinyint('force_path_style').notNull().default(0),
  publicBaseUrl: varchar('public_base_url', { length: 512 }).notNull(),
  status: tinyint('status').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});
