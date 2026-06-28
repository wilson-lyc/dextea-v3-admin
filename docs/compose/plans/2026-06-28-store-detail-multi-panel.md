# 门店详情页多 Panel 改造 + 门店状态/库存 API 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 门店详情页从单页卡片改为多 Panel 布局（基础信息、商品、客制化、原料）。后端提供门店商品状态、客制化选项状态、原料库存的查询与写入接口。遵循"读默认 / 写 UPSERT"模式（详见 `docs/store-entity-status-design.md`）。

**Architecture:**
- `product_store_status`、`customization_option_store_status`、`store_inventory` 三表已在 schema 中，仅需 push
- 新路由文件 `apps/api/src/routes/store-status.ts`，前缀 `/api/v1`
- 新错误码文件 `apps/api/src/errorcode/store-status.ts`（范围 11100-11199）
- 新 shared-types 文件 `packages/shared-types/src/types/store-status.ts`
- 门店详情页改为 Tabs 布局：基础信息 / 商品 / 客制化 / 原料

**Tech Stack:** Drizzle ORM (MySQL), Fastify 5, React 19, shadcn/ui, Tabs, Sheet

---

## Task 1: DB Schema 推送（手动执行）

- [ ] **Step 1: 执行 db:push**

```bash
pnpm --filter dextea-admin-api db:push
```

Expected: Schema pushed successfully (product_store_status, customization_option_store_status, store_inventory 三表已创建）。

---

## Task 2: Shared Types — 新增 store-status 类型

**Files:**
- New: `packages/shared-types/src/types/store-status.ts`
- Modify: `packages/shared-types/src/types/index.ts`
- Modify: `packages/shared-types/src/index.ts`

- [ ] **Step 1: 新建 `store-status.ts`**

```typescript
import type { ProductStatus } from '../status/product.js';
import type { ProductCustomizationStatus } from '../status/product-customization.js';
import type { CustomizationOptionStatus } from '../status/customization-option.js';

// ──── 商品门店状态 ────

export interface StoreProductItem {
  id: number;
  name: string;
  price: number;
  globalStatus: ProductStatus;
  storeStatus: ProductStatus;  // 门店级别状态，无记录时默认 0
}

export interface UpsertProductStoreStatusRequest {
  status: ProductStatus;
}

// ──── 客制化项目门店状态 ────

export interface StoreCustomizationItem {
  id: number;
  name: string;
  displayName: string;
  globalStatus: ProductCustomizationStatus;
  storeStatus: ProductCustomizationStatus;
  optionCount: number;
}

export interface StoreCustomizationOptionItem {
  id: number;
  name: string;
  price: number;
  globalStatus: CustomizationOptionStatus;
  storeStatus: CustomizationOptionStatus;
}

export interface UpsertCustomizationOptionStoreStatusRequest {
  status: CustomizationOptionStatus;
}

// ──── 原料门店库存 ────

export interface StoreIngredientItem {
  id: number;
  name: string;
  unit: string;
  quantity: number;  // 门店库存数量，无记录时默认 0
}
```

- [ ] **Step 2: 在 `types/index.ts` 中导出**

在最后添加：
```typescript
export type {
  StoreProductItem,
  UpsertProductStoreStatusRequest,
  StoreCustomizationItem,
  StoreCustomizationOptionItem,
  UpsertCustomizationOptionStoreStatusRequest,
  StoreIngredientItem,
} from './store-status.js';
```

- [ ] **Step 3: 在 `src/index.ts` 中导出**

在 types 导出块中添加：
```typescript
export type {
  StoreProductItem,
  UpsertProductStoreStatusRequest,
  StoreCustomizationItem,
  StoreCustomizationOptionItem,
  UpsertCustomizationOptionStoreStatusRequest,
  StoreIngredientItem,
} from './types/index.js';
```

- [ ] **Step 4: Commit**

```bash
git add packages/shared-types/src/types/store-status.ts packages/shared-types/src/types/index.ts packages/shared-types/src/index.ts
git commit -m "feat: 新增 store-status 共享类型（商品/客制化门店状态、原料库存）"
```

---

## Task 3: ErrorCode — 新增门店状态错误码

**Files:**
- New: `apps/api/src/errorcode/store-status.ts`
- Modify: `apps/api/src/errorcode/index.ts`

- [ ] **Step 1: 新建 `store-status.ts`**

```typescript
import type { BizError } from './index.js';

/**
 * 门店状态管理错误码 (11100-11199)
 */
export const storeStatusErrors = {
  LIST_PRODUCTS_FAILED: {
    code: 11100,
    message: '获取门店商品状态列表失败',
    httpStatus: 200,
  } satisfies BizError,

  UPDATE_PRODUCT_STATUS_FAILED: {
    code: 11101,
    message: '更新门店商品状态失败',
    httpStatus: 200,
  } satisfies BizError,

  LIST_CUSTOMIZATIONS_FAILED: {
    code: 11102,
    message: '获取门店客制化状态列表失败',
    httpStatus: 200,
  } satisfies BizError,

  LIST_OPTIONS_FAILED: {
    code: 11103,
    message: '获取门店客制化选项状态列表失败',
    httpStatus: 200,
  } satisfies BizError,

  UPDATE_OPTION_STATUS_FAILED: {
    code: 11104,
    message: '更新门店客制化选项状态失败',
    httpStatus: 200,
  } satisfies BizError,

  LIST_INGREDIENTS_FAILED: {
    code: 11105,
    message: '获取门店原料库存列表失败',
    httpStatus: 200,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
```

- [ ] **Step 2: 在 `errorcode/index.ts` 中注册**

在 import 和 export 中添加：
```typescript
export { storeStatusErrors } from './store-status.js';
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/errorcode/store-status.ts apps/api/src/errorcode/index.ts
git commit -m "feat: 新增门店状态管理错误码 (11100-11199)"
```

---

## Task 4: Backend API — 门店状态/库存路由

**Files:**
- New: `apps/api/src/routes/store-status.ts`
- Modify: `apps/api/src/routes/index.ts`

- [ ] **Step 1: 新建 `store-status.ts`**

包含 6 个接口：

| 方法 | 路径 | 功能 | 查询模式 |
|---|---|---|---|
| GET | `/stores/:storeId/products` | 门店商品列表（含门店状态） | products LEFT JOIN product_store_status + COALESCE |
| PATCH | `/stores/:storeId/products/:productId/status` | 设置商品门店状态 | UPSERT |
| GET | `/stores/:storeId/customizations` | 门店客制化项目列表（含门店状态） | product_customizations LEFT JOIN + COALESCE |
| GET | `/stores/:storeId/customizations/:customizationId/options` | 门店客制化选项列表（含门店状态） | customization_options LEFT JOIN customization_option_store_status + COALESCE |
| PATCH | `/stores/:storeId/customization-options/:optionId/status` | 设置客制化选项门店状态 | UPSERT |
| GET | `/stores/:storeId/ingredients` | 门店原料库存列表（含库存数量） | ingredients LEFT JOIN store_inventory + COALESCE |

路由结构要点：
- 所有接口校验 `storeId` 是否存在
- 列表接口使用 `LEFT JOIN + COALESCE`（遵循设计文档 3.4 方案 A）
- 状态写入使用 `INSERT ... ON DUPLICATE KEY UPDATE`（遵循设计文档 3.2）
- 遵循 api-coding-style 的 try/catch 模式
- schema 中添加每个接口的 Fastify Schema 文档定义

- [ ] **Step 2: 在 `routes/index.ts` 中注册**

```typescript
import { storeStatusRoutes } from './store-status.js';
// 在 registerRoutes 函数中添加：
await app.register(storeStatusRoutes, { prefix: config.apiPrefix });
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/store-status.ts apps/api/src/routes/index.ts
git commit -m "feat: 新增门店商品/客制化状态、原料库存 API"
```

---

## Task 5: Frontend Service — 新增 store-status 服务

**Files:**
- New: `apps/web/src/services/store-status.ts`
- Modify: `apps/web/src/services/index.ts`

- [ ] **Step 1: 新建 `store-status.ts`**

```typescript
import type {
  ApiResponse,
  PaginatedData,
  StoreProductItem,
  UpsertProductStoreStatusRequest,
  StoreCustomizationItem,
  StoreCustomizationOptionItem,
  UpsertCustomizationOptionStoreStatusRequest,
  StoreIngredientItem,
} from '@dextea/shared-types'
import { http } from './http'

/** GET /stores/:storeId/products — 门店商品列表（含门店状态） */
export function getStoreProducts(storeId: number, params?: { page?: number; pageSize?: number }) {
  return http.get<ApiResponse<PaginatedData<StoreProductItem>>>(`/stores/${storeId}/products`, { params }).then((r) => r.data)
}

/** PATCH /stores/:storeId/products/:productId/status — 设置商品门店状态 */
export function updateProductStoreStatus(storeId: number, productId: number, data: UpsertProductStoreStatusRequest) {
  return http.patch<ApiResponse<null>>(`/stores/${storeId}/products/${productId}/status`, data).then((r) => r.data)
}

/** GET /stores/:storeId/customizations — 门店客制化项目列表（含门店状态） */
export function getStoreCustomizations(storeId: number, params?: { page?: number; pageSize?: number }) {
  return http.get<ApiResponse<PaginatedData<StoreCustomizationItem>>>(`/stores/${storeId}/customizations`, { params }).then((r) => r.data)
}

/** GET /stores/:storeId/customizations/:customizationId/options — 门店客制化选项列表（含门店状态） */
export function getStoreCustomizationOptions(storeId: number, customizationId: number, params?: { page?: number; pageSize?: number }) {
  return http.get<ApiResponse<PaginatedData<StoreCustomizationOptionItem>>>(`/stores/${storeId}/customizations/${customizationId}/options`, { params }).then((r) => r.data)
}

/** PATCH /stores/:storeId/customization-options/:optionId/status — 设置客制化选项门店状态 */
export function updateCustomizationOptionStoreStatus(storeId: number, optionId: number, data: UpsertCustomizationOptionStoreStatusRequest) {
  return http.patch<ApiResponse<null>>(`/stores/${storeId}/customization-options/${optionId}/status`, data).then((r) => r.data)
}

/** GET /stores/:storeId/ingredients — 门店原料库存列表 */
export function getStoreIngredients(storeId: number, params?: { page?: number; pageSize?: number }) {
  return http.get<ApiResponse<PaginatedData<StoreIngredientItem>>>(`/stores/${storeId}/ingredients`, { params }).then((r) => r.data)
}
```

- [ ] **Step 2: 在 `services/index.ts` 中注册**

在 import/export 行中添加函数名：
```typescript
export { getStoreProducts, updateProductStoreStatus, getStoreCustomizations, getStoreCustomizationOptions, updateCustomizationOptionStoreStatus, getStoreIngredients } from './store-status'
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/store-status.ts apps/web/src/services/index.ts
git commit -m "feat: 新增门店状态/库存前端服务层"
```

---

## Task 6: Frontend — 门店详情页多 Panel 改造

**Files:**
- New: `apps/web/src/pages/Stores/components/ProductsPanel.tsx`
- New: `apps/web/src/pages/Stores/components/CustomizationsPanel.tsx`
- New: `apps/web/src/pages/Stores/components/IngredientsPanel.tsx`
- Modify: `apps/web/src/pages/Stores/detail.tsx`

- [ ] **Step 1: 新建 `ProductsPanel.tsx`**

商品 Panel 组件：
- 使用 shadcn Table 组件展示商品列表（参考 `apps/web/src/pages/Products/` 的表格风格）
- 列：商品名称、全局价格、全局状态（Badge）、门店状态（Switch 开关）
- Switch 开关调用 `updateProductStoreStatus`
- 遵循 `web-table-page` skill：无数据时 Table 内渲染空状态，有数据时显示分页
- 分页初始 pageSize=20

- [ ] **Step 2: 新建 `CustomizationsPanel.tsx`**

客制化 Panel 组件：
- 使用 shadcn Table 展示客制化项目列表
- 列：项目名称、展示名称、全局状态（Badge）、门店状态（Switch）、选项数量
- 点击行主体（除 Switch 外）展开 shadcn Sheet 组件展示该项目下的选项列表
  - Sheet 内使用 Table 展示选项
  - 选项列：名称、价格、全局状态（Badge）、门店状态（Switch）
  - 选项的 Switch 调用 `updateCustomizationOptionStoreStatus`
- 遵循 `web-table-page` skill

- [ ] **Step 3: 新建 `IngredientsPanel.tsx`**

原料 Panel 组件：
- 使用 shadcn Table 展示原料列表
- 列：原料名称、单位、门店库存数量
- 库存数量为只读展示（不提供写入）
- 遵循 `web-table-page` skill

- [ ] **Step 4: 改造 `detail.tsx`**

整体布局改为：
```
┌─────────────────────────────────────┐
│ Breadcrumb: 门店管理 > {store.name}  │
├─────────────────────────────────────┤
│ 基础信息 | 商品 | 客制化 | 原料       │  ← shadcn Tabs
├─────────────────────────────────────┤
│                                     │
│  Tab content area                    │
│  基础信息 Tab: 现有卡片内容（状态/     │
│  基础信息/位置/维护记录 合成一个面板）  │
│                                     │
│  商品 Tab: ProductsPanel             │
│  客制化 Tab: CustomizationsPanel     │
│  原料 Tab: IngredientsPanel          │
└─────────────────────────────────────┘
```

改造要点：
- 将原有 4 个独立 Card（门店状态、基础信息、门店位置、维护记录）合并到**基础信息 Tab** 中，保持原有样式
- 使用 shadcn `<Tabs>` 组件，`defaultValue="basic"`
- 引入 `TabsTrigger` 的标签：`基础信息` `商品` `客制化` `原料`
- 原有 Dialog（密码重置、EditStatusDialog、EditBasicInfoDialog、EditLocationDialog）保持在基础信息 Tab 的范围内
- 加载状态（`loading`）、错误状态（`store` 不存在）保持与改造前一致

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/Stores/detail.tsx apps/web/src/pages/Stores/components/
git commit -m "feat: 门店详情页多 Panel 改造（基础信息/商品/客制化/原料）"
```

---

## Task 7: 验证

- [ ] **Step 1: Type-check**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 2: Build**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: LSP diagnostics 检查**

检查所有新增/修改文件的 LSP diagnostics，确保无 type error 和 lint error。
