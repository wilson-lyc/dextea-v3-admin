import {
  mysqlTable,
  serial,
  varchar,
  tinyint,
  timestamp,
  bigint,
  text,
  double,
  primaryKey,
} from 'drizzle-orm/mysql-core';
import type { UserStatus, StoreStatus } from '@dextea/shared-types';

/**
 * 用户表
 */
export const usersTable = mysqlTable('users', {
  id: serial().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  status: tinyint().$type<UserStatus>().notNull().default(1),
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
  status: tinyint().$type<UserStatus>().notNull().default(1),
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
export const userRolesTable = mysqlTable(
  'user_roles',
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
export const rolePermissionsTable = mysqlTable(
  'role_permissions',
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
  // 门店状态：0 休息中、1 营业中、2 筹备中、3 已注销
  status: tinyint().$type<StoreStatus>().notNull().default(2),
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
