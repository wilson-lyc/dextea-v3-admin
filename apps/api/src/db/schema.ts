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
    primaryKey: primaryKey({ columns: [table.userId, table.roleId] }),
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
    primaryKey: primaryKey({ columns: [table.roleId, table.permissionId] }),
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
    primaryKey: primaryKey({ columns: [table.productId, table.tagId] }),
  }),
);

/**
 * 客制化项目表
 */
export const productCustomizationsTable = mysqlTable('product_customizations', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
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
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.productId, table.customizationId] }),
  }),
);

/**
 * 客制化选项表
 */
export const customizationOptionsTable = mysqlTable('customization_options', {
  id: serial().primaryKey(),
  customizationId: bigint('customization_id', { mode: 'number', unsigned: true }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  price: double().notNull().default(0),
  status: tinyint().notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});
