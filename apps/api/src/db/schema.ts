import {
  mysqlTable,
  serial,
  varchar,
  tinyint,
  timestamp,
  bigint,
  text,
  primaryKey,
} from 'drizzle-orm/mysql-core';

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────
export const usersTable = mysqlTable('users', {
  id: serial().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  status: tinyint().notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// ──────────────────────────────────────────────
// Roles
// ──────────────────────────────────────────────
export const rolesTable = mysqlTable('roles', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  note: text(),
  status: tinyint().notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// ──────────────────────────────────────────────
// Permissions
// ──────────────────────────────────────────────
export const permissionsTable = mysqlTable(
  'permissions',
  {
    id: serial().primaryKey(),
    key: varchar({ length: 255 }).notNull().unique(),
    name: varchar({ length: 255 }).notNull(),
    note: text(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
);

// ──────────────────────────────────────────────
// Pivot: User <-> Role (M:N)
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Pivot: Role <-> Permission (M:N)
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Config (key-value 配置表)
// ──────────────────────────────────────────────
export const configTable = mysqlTable('config', {
  id: serial().primaryKey(),
  key: varchar({ length: 255 }).notNull().unique(),
  value: text().notNull().default(''),
  note: varchar({ length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});
