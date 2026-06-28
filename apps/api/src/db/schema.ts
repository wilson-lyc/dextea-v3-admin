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
} from 'drizzle-orm/mysql-core';

/**
 * 用户表
 */
export const usersTable = mysqlTable('users', {
  id: serial().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  status: tinyint().notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 角色表
 */
export const rolesTable = mysqlTable('roles', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  note: text(),
  status: tinyint().notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 权限表
 */
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

/**
 * 用户-角色关联表
 */
export const userRoleRelationsTable = mysqlTable(
  'user_role_relations',
  {
    userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull(),
    roleId: bigint('role_id', { mode: 'number', unsigned: true }).notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_user_role_relations',
      columns: [table.userId, table.roleId],
    }),
  }),
);

/**
 * 角色-权限关联表
 */
export const rolePermissionRelationsTable = mysqlTable(
  'role_permission_relations',
  {
    roleId: bigint('role_id', { mode: 'number', unsigned: true }).notNull(),
    permissionId: bigint('permission_id', { mode: 'number', unsigned: true }).notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_role_permission_relations',
      columns: [table.roleId, table.permissionId],
    }),
  }),
);

/**
 * 系统配置表
 */
export const configTable = mysqlTable('config', {
  id: serial().primaryKey(),
  key: varchar({ length: 255 }).notNull().unique(),
  value: text().notNull().default(''),
  note: varchar({ length: 255 }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 门店表
 */
export const storesTable = mysqlTable('stores', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  province: varchar({ length: 100 }).notNull().default(''),
  city: varchar({ length: 100 }).notNull().default(''),
  district: varchar({ length: 100 }).notNull().default(''),
  address: varchar({ length: 500 }).notNull().default(''),
  status: tinyint().notNull().default(2),
  businessHours: varchar('business_hours', { length: 255 }).notNull().default(''),
  phone: varchar({ length: 50 }).notNull().default(''),
  longitude: double().notNull().default(0),
  latitude: double().notNull().default(0),
  account: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().default(''),
  menuId: bigint('menu_id', { mode: 'number', unsigned: true }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 商品表
 */
export const productsTable = mysqlTable('products', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  brief: varchar('brief', { length: 500 }).notNull().default(''),
  description: varchar({ length: 2000 }).notNull().default(''),
  status: tinyint().notNull().default(0),
  price: double().notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 商品标签表
 */
export const productTagsTable = mysqlTable('product_tags', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 商品-标签关联表
 */
export const productTagRelationsTable = mysqlTable(
  'product_tag_relations',
  {
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    tagId: bigint('tag_id', { mode: 'number', unsigned: true }).notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_product_tag_relations',
      columns: [table.productId, table.tagId],
    }),
  }),
);

/**
 * 客制化项目表
 */
export const productCustomizationsTable = mysqlTable('product_customizations', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull().default(''),
  status: tinyint().notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 商品-客制化关联表
 */
export const productCustomizationRelationsTable = mysqlTable(
  'product_customization_relations',
  {
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    customizationId: bigint('customization_id', { mode: 'number', unsigned: true }).notNull(),
    sort: tinyint().notNull().default(0),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_product_customization_relations',
      columns: [table.productId, table.customizationId],
    }),
  }),
);

/**
 * 商品-原料关联表
 */
export const productIngredientRelationsTable = mysqlTable(
  'product_ingredient_relations',
  {
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    ingredientId: bigint('ingredient_id', { mode: 'number', unsigned: true }).notNull(),
    quantity: double().notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_product_ingredient_relations',
      columns: [table.productId, table.ingredientId],
    }),
  }),
);

/**
 * 原料表
 */
export const ingredientsTable = mysqlTable('ingredients', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  unit: varchar({ length: 50 }).notNull(),
  status: tinyint().notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 客制化选项表
 */
export const customizationOptionsTable = mysqlTable('customization_options', {
  id: serial().primaryKey(),
  customizationId: bigint('customization_id', { mode: 'number', unsigned: true }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  price: double().notNull().default(0),
  sort: tinyint().notNull().default(0),
  status: tinyint().notNull().default(0),
  ingredientId: bigint('ingredient_id', { mode: 'number', unsigned: true }),
  quantity: double().notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 商品-门店状态表
 * 记录商品在每个门店的独立状态（独立于 productsTable.status 全局状态）
 */
export const productStoreStatusTable = mysqlTable(
  'product_store_status',
  {
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    storeId: bigint('store_id', { mode: 'number', unsigned: true }).notNull(),
    status: tinyint().notNull().default(0),
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

/**
 * 客制化选项-门店状态表
 * 记录客制化选项在每个门店的独立状态（独立于 customizationOptionsTable.status 全局状态）
 */
export const customizationOptionStoreStatusTable = mysqlTable(
  'customization_option_store_status',
  {
    customizationOptionId: bigint('customization_option_id', { mode: 'number', unsigned: true }).notNull(),
    storeId: bigint('store_id', { mode: 'number', unsigned: true }).notNull(),
    status: tinyint().notNull().default(0),
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

/**
 * 原料-门店库存表
 * 记录每种原料在每家门店的库存数量
 */
export const storeInventoryTable = mysqlTable(
  'store_inventory',
  {
    ingredientId: bigint('ingredient_id', { mode: 'number', unsigned: true }).notNull(),
    storeId: bigint('store_id', { mode: 'number', unsigned: true }).notNull(),
    quantity: double().notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_store_inventory',
      columns: [table.ingredientId, table.storeId],
    }),
  }),
);

/**
 * 菜单表
 * 管理菜单的基本信息，独立于门店存在，可被多个门店共享
 */
export const menusTable = mysqlTable('menus', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }).notNull().default(''),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 菜单分组表
 * 菜单下的分类容器（如"推荐"、"咖啡"、"甜点"），决定商品的分组展示
 */
export const menuGroupsTable = mysqlTable('menu_groups', {
  id: serial().primaryKey(),
  menuId: bigint('menu_id', { mode: 'number', unsigned: true }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 菜单商品关联表
 * 记录分组与商品的关联关系及排序，同一分组下同一商品只能绑定一次
 */
export const menuProductsTable = mysqlTable(
  'menu_products',
  {
    groupId: bigint('group_id', { mode: 'number', unsigned: true }).notNull(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    sortOrder: int('sort_order').notNull().default(0),
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
