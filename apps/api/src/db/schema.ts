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

/**
 * 员工表
 */
export const employeesTable = mysqlTable('employees', {
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
 * 员工-角色关联表
 */
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
    primaryKey: primaryKey({
      name: 'pk_role_permissions',
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
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 门店-菜单关联表
 * 记录门店与菜单的绑定关系，支持同一门店绑定多个菜单（通过复合主键扩展）
 */
export const storeMenusTable = mysqlTable(
  'store_menus',
  {
    storeId: bigint('store_id', { mode: 'number', unsigned: true }).notNull(),
    menuId: bigint('menu_id', { mode: 'number', unsigned: true }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      name: 'pk_store_menus',
      columns: [table.storeId, table.menuId],
    }),
  }),
);

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

/**
 * 客制化项目表
 * productId 与商品表 1对多 关联（一个商品可以有多个客制化项目）
 */
export const productCustomizationsTable = mysqlTable('product_customizations', {
  id: serial().primaryKey(),
  productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  status: tinyint().notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 商品-原料关联表
 */
export const productIngredientsTable = mysqlTable(
  'product_ingredients',
  {
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    ingredientId: bigint('ingredient_id', { mode: 'number', unsigned: true }).notNull(),
    quantity: double().notNull().default(0),
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

/**
 * 顾客表
 */
export const customersTable = mysqlTable(
  'customers',
  {
    id: serial().primaryKey(),
    source: tinyint().notNull(), // 来源平台：1=微信小程序，2=支付宝小程序
    openId: varchar('open_id', { length: 255 }).notNull(),
    nickname: varchar({ length: 255 }).notNull().default(''),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    uniqueOpenIdPerSource: uniqueIndex('uq_customers_source_openid').on(table.source, table.openId),
    uniqueOpenId: uniqueIndex('uq_customers_openid').on(table.openId),
  }),
);

/**
 * 订单表
 * 记录订单基础信息，归属某位顾客（customers）与某一门店（stores）。
 * status：0=待支付 1=已支付/制作中 2=已完成 3=已取消 4=已退款
 * payMethod：1=微信支付 2=支付宝（与顾客来源平台对应）
 * paidAt：支付时间，未支付时为 null
 */
export const ordersTable = mysqlTable('orders', {
  id: serial().primaryKey(),
  orderNo: varchar('order_no', { length: 64 }).notNull().unique(), // 业务订单号（对外展示/对账用，区别于自增 id）
  customerId: bigint('customer_id', { mode: 'number', unsigned: true }).notNull(), // 关联顾客
  storeId: bigint('store_id', { mode: 'number', unsigned: true }).notNull(), // 关联门店
  status: tinyint().notNull().default(0),
  totalAmount: double('total_amount').notNull().default(0), // 订单总金额
  payMethod: tinyint('pay_method'), // 支付方式：1=微信 2=支付宝
  remark: varchar({ length: 500 }).notNull().default(''), // 订单备注
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(), // 创建时间
  paidAt: timestamp('paid_at', { mode: 'string' }), // 支付时间
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 订单详情表
 * 记录订单下顾客实际购买的商品行，一行对应一个 SKU（商品 + 客制化组合）。
 */
export const orderItemsTable = mysqlTable(
  'order_items',
  {
    id: serial().primaryKey(),
    orderId: bigint('order_id', { mode: 'number', unsigned: true }).notNull(), // 关联订单
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(), // 关联商品
    skuId: varchar('sku_id', { length: 255 }).notNull().default(''), // SKU 标识（生成规则待定，此处仅占位）
    unitPrice: double('unit_price').notNull().default(0), // 实际单价（已含客制化加价，奶茶加料后价格不同）
    quantity: int().notNull().default(1), // 购买数量
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    uniqueOrderSku: uniqueIndex('uq_order_items_order_sku').on(table.orderId, table.skuId), // 同一订单内同一 SKU 仅一行
  }),
);
