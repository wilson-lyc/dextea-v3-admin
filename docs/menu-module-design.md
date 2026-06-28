# 菜单管理模块设计

## 1. 概述

菜单（Menu）是管理后台的核心管理单元，用于组织和管理商品集合。每个门店关联一个菜单，菜单下包含多个**菜单分组**（MenuGroup），每个分组下包含多个**菜单商品**（MenuProduct），均支持拖拽排序。

**核心概念**：
- 菜单（Menu）：独立于门店存在，一个菜单可被多个门店共享，一个门店只能关联一个菜单
- 菜单分组（MenuGroup）：菜单下的分类容器（如"推荐"、"咖啡"、"甜点"），决定商品的分组展示
- 菜单商品（MenuProduct）：分组与商品的关联关系，包含排序信息

**层级关系**：
```
Menu (菜单)
  └── MenuGroup (分组) × N
        └── MenuProduct (商品) × N
```

## 2. 数据模型

### 2.1 菜单表（menus）

```sql
CREATE TABLE menus (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.2 菜单分组表（menu_groups）

```sql
CREATE TABLE menu_groups (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  menu_id    BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_menu_id (menu_id)
);
```

**字段说明**：
- `menu_id`：所属菜单 ID
- `name`：分组名称（如"推荐"、"咖啡"、"甜点"）
- `sort_order`：排序值，数值越小越靠前，支持拖拽排序

### 2.3 菜单商品关联表（menu_products）

```sql
CREATE TABLE menu_products (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id   BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_group_product (group_id, product_id),
  INDEX idx_group_id (group_id)
);
```

**字段说明**：
- `group_id`：所属分组 ID（而非直接关联菜单）
- `sort_order`：排序值，数值越小越靠前，支持拖拽排序时更新
- `group_id + product_id`：唯一约束，同一分组下同一商品只能绑定一次

### 2.4 门店表扩展

在现有 `stores` 表中新增 `menu_id` 字段：

```sql
ALTER TABLE stores ADD COLUMN menu_id BIGINT UNSIGNED;
```

- `menu_id` 可为空，表示门店尚未关联菜单
- 一个门店只能关联一个菜单

## 3. API 设计

### 3.1 菜单 CRUD

#### 创建菜单

```
POST /api/v1/menus
```

**Request Body**：
```json
{
  "name": "夏季菜单"
}
```

**Response**：
```json
{
  "id": 1,
  "name": "夏季菜单",
  "createdAt": "2026-06-28T00:00:00Z",
  "updatedAt": "2026-06-28T00:00:00Z"
}
```

#### 获取菜单详情

```
GET /api/v1/menus/:id
```

**Response**：
```json
{
  "id": 1,
  "name": "夏季菜单",
  "groups": [
    {
      "id": 1,
      "name": "推荐",
      "sortOrder": 0,
      "products": [
        {
          "id": 1,
          "productId": 101,
          "productName": "冰美式",
          "productPrice": 25,
          "sortOrder": 0
        }
      ]
    },
    {
      "id": 2,
      "name": "咖啡",
      "sortOrder": 1,
      "products": [
        {
          "id": 2,
          "productId": 102,
          "productName": "冰拿铁",
          "productPrice": 28,
          "sortOrder": 0
        },
        {
          "id": 3,
          "productId": 103,
          "productName": "美式咖啡",
          "productPrice": 22,
          "sortOrder": 1
        }
      ]
    }
  ],
  "createdAt": "2026-06-28T00:00:00Z",
  "updatedAt": "2026-06-28T00:00:00Z"
}
```

#### 菜单列表（分页）

```
GET /api/v1/menus?page=1&pageSize=20&keyword=夏季
```

**Response**：
```json
{
  "items": [
    {
      "id": 1,
      "name": "夏季菜单",
      "groupCount": 3,
      "productCount": 15,
      "createdAt": "2026-06-28T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### 更新菜单

```
PUT /api/v1/menus/:id
```

**Request Body**：
```json
{
  "name": "夏季限定菜单"
}
```

#### 删除菜单

```
DELETE /api/v1/menus/:id
```

- 删除菜单时，同时删除所有分组及分组下的商品关联
- 若有门店关联此菜单，需先解除关联或提示

### 3.2 菜单分组管理

#### 创建分组

```
POST /api/v1/menus/:menuId/groups
```

**Request Body**：
```json
{
  "name": "推荐",
  "sortOrder": 0
}
```

**Response**：
```json
{
  "id": 1,
  "menuId": 1,
  "name": "推荐",
  "sortOrder": 0,
  "createdAt": "2026-06-28T00:00:00Z",
  "updatedAt": "2026-06-28T00:00:00Z"
}
```

#### 更新分组

```
PUT /api/v1/menus/:menuId/groups/:groupId
```

**Request Body**：
```json
{
  "name": "人气推荐",
  "sortOrder": 1
}
```

- `name` 和 `sortOrder` 均为可选，只传需要修改的字段

#### 删除分组

```
DELETE /api/v1/menus/:menuId/groups/:groupId
```

- 删除分组时，同时删除该分组下所有 menu_products 记录

#### 更新分组排序

```
PUT /api/v1/menus/:menuId/groups/sort
```

**Request Body**：
```json
{
  "items": [
    { "groupId": 1, "sortOrder": 2 },
    { "groupId": 2, "sortOrder": 0 },
    { "groupId": 3, "sortOrder": 1 }
  ]
}
```

- 批量更新分组排序值，通常在拖拽排序后调用

### 3.3 分组商品管理

#### 绑定商品到分组

```
POST /api/v1/groups/:groupId/products
```

**Request Body**：
```json
{
  "items": [
    { "productId": 101, "sortOrder": 0 },
    { "productId": 102, "sortOrder": 1 }
  ]
}
```

- `items`：商品 ID + 排序值 列表
- `sortOrder`：可选，默认为 0，用于指定商品在分组中的初始排序位置
- 已存在的商品会被忽略（不报错）

#### 更新分组商品排序

```
PUT /api/v1/groups/:groupId/products/sort
```

**Request Body**：
```json
{
  "items": [
    { "productId": 101, "sortOrder": 2 },
    { "productId": 102, "sortOrder": 0 },
    { "productId": 103, "sortOrder": 1 }
  ]
}
```

- 批量更新排序值，通常在拖拽排序后调用

#### 解绑分组商品

```
DELETE /api/v1/groups/:groupId/products
```

**Request Body**：
```json
{
  "productIds": [101, 102]
}
```

- 批量解绑商品

### 3.4 门店关联菜单

#### 门店绑定菜单

```
PUT /api/v1/stores/:storeId/menu
```

**Request Body**：
```json
{
  "menuId": 1
}
```

#### 门店解绑菜单

```
DELETE /api/v1/stores/:storeId/menu
```

- 将门店的 `menu_id` 置为 null

## 4. 实现细节

### 4.1 数据库 Schema（Drizzle）

```typescript
// apps/api/src/db/schema.ts

/**
 * 菜单表
 */
export const menusTable = mysqlTable('menus', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

/**
 * 菜单分组表
 */
export const menuGroupsTable = mysqlTable(
  'menu_groups',
  {
    id: serial().primaryKey(),
    menuId: bigint('menu_id', { mode: 'number', unsigned: true }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    sortOrder: int('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    idxMenuId: index('idx_menu_id').on(table.menuId),
  }),
);

/**
 * 菜单商品关联表
 */
export const menuProductsTable = mysqlTable(
  'menu_products',
  {
    id: serial().primaryKey(),
    groupId: bigint('group_id', { mode: 'number', unsigned: true }).notNull(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    sortOrder: int('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    ukGroupProduct: unique('uk_group_product').on(table.groupId, table.productId),
    idxGroupId: index('idx_group_id').on(table.groupId),
  }),
);

// stores 表新增字段
// menuId: bigint('menu_id', { mode: 'number', unsigned: true })
```

### 4.2 核心实现

#### 创建分组

```typescript
async function createMenuGroup(
  db: DrizzleDB,
  menuId: number,
  data: { name: string; sortOrder?: number },
) {
  const [result] = await db.insert(menuGroupsTable).values({
    menuId,
    name: data.name,
    sortOrder: data.sortOrder ?? 0,
  });
  return result;
}
```

#### 删除分组

```typescript
async function deleteMenuGroup(
  db: DrizzleDB,
  groupId: number,
) {
  // 先删除分组下的商品关联
  await db.delete(menuProductsTable).where(eq(menuProductsTable.groupId, groupId));
  // 再删除分组
  await db.delete(menuGroupsTable).where(eq(menuGroupsTable.id, groupId));
}
```

#### 绑定商品到分组

```typescript
async function addGroupProducts(
  db: DrizzleDB,
  groupId: number,
  items: Array<{ productId: number; sortOrder?: number }>,
) {
  if (items.length === 0) return;

  // 使用 INSERT IGNORE 避免重复绑定报错
  await db.insert(menuProductsTable).values(
    items.map((item) => ({
      groupId,
      productId: item.productId,
      sortOrder: item.sortOrder ?? 0,
    })),
  );
}
```

#### 更新排序

```typescript
async function updateGroupProductsSort(
  db: DrizzleDB,
  groupId: number,
  items: Array<{ productId: number; sortOrder: number }>,
) {
  // 逐条更新（排序操作通常数据量不大）
  for (const item of items) {
    await db
      .update(menuProductsTable)
      .set({ sortOrder: item.sortOrder })
      .where(
        and(
          eq(menuProductsTable.groupId, groupId),
          eq(menuProductsTable.productId, item.productId),
        ),
      );
  }
}
```

#### 解绑商品

```typescript
async function removeGroupProducts(
  db: DrizzleDB,
  groupId: number,
  productIds: number[],
) {
  if (productIds.length === 0) return;

  await db
    .delete(menuProductsTable)
    .where(
      and(
        eq(menuProductsTable.groupId, groupId),
        inArray(menuProductsTable.productId, productIds),
      ),
    );
}
```

#### 获取菜单详情（含分组及商品列表）

```typescript
async function getMenuDetail(db: DrizzleDB, menuId: number) {
  const menu = await db.query.menusTable.findFirst({
    where: eq(menusTable.id, menuId),
  });

  if (!menu) throw new AppError('菜单不存在');

  // 查询所有分组
  const groups = await db
    .select()
    .from(menuGroupsTable)
    .where(eq(menuGroupsTable.menuId, menuId))
    .orderBy(menuGroupsTable.sortOrder);

  // 查询所有分组下的商品
  const groupIds = groups.map((g) => g.id);
  const products = groupIds.length > 0
    ? await db
        .select({
          id: menuProductsTable.id,
          groupId: menuProductsTable.groupId,
          productId: menuProductsTable.productId,
          productName: productsTable.name,
          productPrice: productsTable.price,
          sortOrder: menuProductsTable.sortOrder,
        })
        .from(menuProductsTable)
        .innerJoin(productsTable, eq(menuProductsTable.productId, productsTable.id))
        .where(inArray(menuProductsTable.groupId, groupIds))
        .orderBy(menuProductsTable.sortOrder)
    : [];

  // 按分组组装
  const groupsWithProducts = groups.map((group) => ({
    ...group,
    products: products.filter((p) => p.groupId === group.id),
  }));

  return { ...menu, groups: groupsWithProducts };
}
```

### 4.3 路由注册

```typescript
// apps/api/src/routes/v1/menus.ts

export const menuRoutes = new Hono()
  // 菜单 CRUD
  .post('/', createMenu)
  .get('/', listMenus)
  .get('/:id', getMenu)
  .put('/:id', updateMenu)
  .delete('/:id', deleteMenu)
  // 菜单分组管理
  .post('/:menuId/groups', createMenuGroup)
  .put('/:menuId/groups/:groupId', updateMenuGroup)
  .delete('/:menuId/groups/:groupId', deleteMenuGroup)
  .put('/:menuId/groups/sort', updateMenuGroupsSort)
  // 分组商品管理
  .post('/groups/:groupId/products', addGroupProducts)
  .put('/groups/:groupId/products/sort', updateGroupProductsSort)
  .delete('/groups/:groupId/products', removeGroupProducts);
```

## 5. 注意事项

### 5.1 删除菜单的安全检查

删除菜单前检查是否有门店关联：
```typescript
async function deleteMenu(db: DrizzleDB, menuId: number) {
  const stores = await db.query.storesTable.findMany({
    where: eq(storesTable.menuId, menuId),
  });

  if (stores.length > 0) {
    throw new AppError(`菜单已被 ${stores.length} 个门店关联，请先解除关联`);
  }

  // 删除菜单下所有分组的商品关联
  const groups = await db
    .select({ id: menuGroupsTable.id })
    .from(menuGroupsTable)
    .where(eq(menuGroupsTable.menuId, menuId));
  const groupIds = groups.map((g) => g.id);
  if (groupIds.length > 0) {
    await db.delete(menuProductsTable).where(inArray(menuProductsTable.groupId, groupIds));
  }
  // 删除菜单分组
  await db.delete(menuGroupsTable).where(eq(menuGroupsTable.menuId, menuId));
  // 删除菜单
  await db.delete(menusTable).where(eq(menusTable.id, menuId));
}
```

### 5.2 排序值建议

- 使用 0-based 索引
- 拖拽排序后，前端计算新的 sortOrder 值并批量提交
- 排序值不要求连续，只需保证大小关系正确

### 5.3 无商品状态

本模块**不关注商品状态**，只管理菜单与商品的绑定关系和排序。商品的可用状态由其他模块（如门店-商品状态）独立管理。
