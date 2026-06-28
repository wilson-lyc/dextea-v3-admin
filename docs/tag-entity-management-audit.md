# 商品标签（Product Tag）实体管理调查报告

**日期:** 2026-06-28  
**项目:** dextea-admin  
**范围:** 增、删、查、改、绑定操作完备性检查

---

## 一、数据层（DB Schema）

**文件:** `apps/api/src/db/schema.ts`

### 标签表 `product_tags`

| 列 | 类型 | 约束 |
|---|---|---|
| `id` | `serial` (BIGINT) | Primary Key, auto-increment |
| `name` | `varchar(255)` | NOT NULL, UNIQUE |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT NOW, ON UPDATE NOW |

### 关联表 `product_tag_relations`

| 列 | 类型 | 约束 |
|---|---|---|
| `product_id` | `bigint(unsigned)` | NOT NULL, PK(composite) |
| `tag_id` | `bigint(unsigned)` | NOT NULL, PK(composite) |

复合主键 `pk_product_tag_relations` = `(product_id, tag_id)`

**结论:** 表结构完备，支持 N:N 多对多关系。

---

## 二、类型定义层（Shared Types）

**文件:** `packages/shared-types/src/types/tag.ts`

| 类型 | 字段 | 用途 |
|---|---|---|
| `ProductTag` | `id`, `name`, `boundCount?`, `createdAt?`, `updatedAt?` | 标签实体 |
| `CreateTagInput` | `name` | 创建输入 |
| `UpdateTagInput` | `name` | 更新输入 |
| `TagQuery` | `page?`, `pageSize?` | 列表查询参数 |
| `BindProductToTagInput` | `productIds: number[]` | 批量绑定商品→标签 (POST) |
| `BindTagToProductInput` | `tagIds: number[]` | 批量绑定标签→商品 (POST) |
| `UnbindProductFromTagInput` | `productIds: number[]` | 批量解绑商品→标签 (DELETE) |
| `UnbindTagFromProductInput` | `tagIds: number[]` | 批量解绑标签→商品 (DELETE) |

同时在 `product.ts` 中引用 `ProductTag` 用于 `Product.tags` 和 `Product.tagIds` 字段。

**结论:** 类型定义完备，覆盖 CRUD 及批量绑定/解绑操作。

---

## 三、后端 API（Routes）

### 3.1 标签独立管理 — `apps/api/src/routes/tags.ts`

| 操作 | HTTP | 路径 | Body | 状态 |
|---|---|---|---|---|
| **查（列表）** | `GET` | `/api/v1/tags?page=&pageSize=` | — | ✅ |
| **增** | `POST` | `/api/v1/tags` | `{name}` | ✅ |
| **改** | `PUT` | `/api/v1/tags/:id` | `{name}` | ✅ |
| **删** | `DELETE` | `/api/v1/tags/:id` | — | ✅ |
| **查（标签绑定的商品列表）** | `GET` | `/api/v1/tags/:id/products?page=&pageSize=` | — | ✅ |
| **批量绑定** | `POST` | `/api/v1/tags/:id/products` | `{productIds: number[]}` | ✅ |
| **批量解绑** | `DELETE` | `/api/v1/tags/:id/products` | `{productIds: number[]}` | ✅ |

### 3.2 商品侧标签绑定 — `apps/api/src/routes/products.ts`

| 操作 | HTTP | 路径 | Body | 状态 |
|---|---|---|---|---|
| **查（商品绑定的标签列表）** | `GET` | `/api/v1/products/:id/tags` | — | ✅ |
| **批量绑定** | `POST` | `/api/v1/products/:id/tags` | `{tagIds: number[]}` | ✅ |
| **批量解绑** | `DELETE` | `/api/v1/products/:id/tags` | `{tagIds: number[]}` | ✅ |
| **创建商品时绑定** | `POST` | `/api/v1/products` | 附带 `tagIds: number[]` | ✅ |
| **商品列表含标签** | `GET` | `/api/v1/products` | 返回 `tags[]` | ✅ |
| **商品选项** | `GET` | `/api/v1/products/options` | (用于 SelectPicker) | ✅ |

### 3.3 功能特性

- 创建/更新标签时校验名称唯一性（排除自身）
- 绑定前校验标签和商品是否存在
- 绑定前过滤已关联的 ID，跳过重复绑定
- 绑定/解绑端点均支持批量提交 ID 数组，前端可单次传入 `[id]` 实现按个操作
- 删除标签时同步删除 `product_tag_relations` 中的关联记录
- 标签列表返回 `boundCount`（动态计算关联商品数量）
- 所有 handler 使用 try/catch + AppError 异常规范
- 请求参数使用 `parsePositiveInt`、`validateMaxLength` 等校验函数

**结论:** API 层完全覆盖增、删、查、改、批量绑定/解绑操作，且具备完整的事务一致性和参数校验。

---

## 四、错误码定义

**文件:** `apps/api/src/errorcode/tags.ts`（范围 10700-10709）

| 错误码 | 常量 | 消息 |
|---|---|---|
| 10700 | `NAME_REQUIRED` | 标签名称不能为空 |
| 10701 | `TAG_NOT_FOUND` | 标签不存在 |
| 10702 | `DUPLICATE_NAME` | 标签名称已存在 |
| 10703 | `LIST_FAILED` | 获取标签列表失败 |
| 10704 | `CREATE_FAILED` | 创建标签失败 |
| 10705 | `UPDATE_FAILED` | 更新标签失败 |
| 10706 | `DELETE_FAILED` | 删除标签失败 |
| 10707 | `PRODUCT_ALREADY_BOUND` | 该商品已绑定此标签 |
| 10708 | `BIND_FAILED` | 绑定商品失败 |
| 10709 | `UNBIND_FAILED` | 解绑商品失败 |

**文件:** `apps/api/src/errorcode/products.ts`（部分）

| 错误码 | 常量 | 消息 |
|---|---|---|
| 10614 | `TAG_ALREADY_EXISTS` | 该标签已绑定该商品 |
| 10615 | `TAG_ADD_FAILED` | 绑定标签失败 |
| 10616 | `TAG_REMOVE_FAILED` | 删除标签失败 |

**结论:** 错误码覆盖所有操作场景，前后端错误信息一致。

---

## 五、前端实现

### 5.1 标签管理页面 — `apps/web/src/pages/ProductTags/index.tsx`

| 功能 | 实现方式 | 状态 |
|---|---|---|
| 标签列表展示 | Table 组件，含 ID/名称/关联商品数/操作列 | ✅ |
| 分页 | Pagination 组件 | ✅ |
| 空状态 | Empty 组件（icon + "暂无数据" + "立即添加" 按钮） | ✅ |
| 新增标签 | Dialog：名称输入，Enter 或点击确认提交 | ✅ |
| 编辑标签（重命名） | Dialog：预填名称，提交后刷新列表 | ✅ |
| 删除标签 | Dialog 确认弹窗（含不可撤销警告），确认后删除 | ✅ |
| 关联商品（绑定管理） | Sheet（侧边栏）：绑/解绑商品列表 | ✅ |

### 5.2 商品详情标签面板 — `apps/web/src/pages/Products/components/TagsPanel.tsx`

| 功能 | 实现方式 | 状态 |
|---|---|---|
| 商品维度查看已绑标签 | 分页 Table | ✅ |
| 绑定标签 | AddTagDialog：Select 选择未绑标签 | ✅ |
| 解绑标签 | Dialog 确认弹窗 | ✅ |
| 空状态 | Empty 组件 + "立即添加" 按钮 | ✅ |

### 5.3 标签侧绑定管理 — `apps/web/src/pages/ProductTags/components/ProductBindingSheet.tsx`

| 功能 | 实现方式 | 状态 |
|---|---|---|
| 查看已绑商品 | 分页 Table | ✅ |
| 绑定商品 | Dialog：SelectPicker 选择商品，支持搜索 | ✅ |
| 解绑商品 | Dialog 确认弹窗 | ✅ |
| 跳转商品详情 | ExternalLinkIcon + navigate | ✅ |
| 空状态 | Empty 组件 | ✅ |

### 5.4 新建商品时绑定标签 — `apps/web/src/pages/Products/components/CreateProductDialog.tsx`

| 功能 | 实现方式 | 状态 |
|---|---|---|
| 创建商品时选择标签 | Multi-select，提交附带 `tagIds` | ✅ |

### 5.5 前端 Service 层 — `apps/web/src/services/tag.ts`

| 函数 | 对应 API | 说明 | 状态 |
|---|---|---|---|
| `getTags()` | `GET /tags` | — | ✅ |
| `createTag()` | `POST /tags` | — | ✅ |
| `updateTag()` | `PUT /tags/:id` | — | ✅ |
| `deleteTag()` | `DELETE /tags/:id` | — | ✅ |
| `getTagBoundProducts()` | `GET /tags/:id/products` | — | ✅ |
| `bindProductToTag()` | `POST /tags/:id/products` | 传 `{productIds: [id]}` 单次绑定 | ✅ |
| `unbindProductFromTag()` | `DELETE /tags/:id/products` | 传 `{productIds: [id]}` 单次解绑 | ✅ |

### 5.6 前端 Service 层 — `apps/web/src/services/product.ts`

| 函数 | 对应 API | 说明 | 状态 |
|---|---|---|---|
| `getProductTags()` | `GET /products/:id/tags` | — | ✅ |
| `addProductTag()` | `POST /products/:id/tags` | 传 `{tagIds: [id]}` 单次绑定 | ✅ |
| `removeProductTag()` | `DELETE /products/:id/tags` | 传 `{tagIds: [id]}` 单次解绑 | ✅ |
| `getProductOptions()` | `GET /products/options` | — | ✅ |

### 5.7 路由与导航

- **路由:** `App.tsx` 中注册为 `/products/tags`，导入 `TagListPage`（来自 `pages/ProductTags/index.tsx`）
- **侧边栏:** `Sidebar.tsx` 中商品管理分组下包含「标签」入口，路径 `/products/tags`

---

## 六、总评

### 完备性矩阵

| 操作 | 数据层 (Schema) | 类型定义 | API 层 | 前端页面 | 状态 |
|---|---|---|---|---|---|
| **增 (Create)** | ✅ | `CreateTagInput` | `POST /tags` | ProductTags 新增 Dialog | ✅ |
| **删 (Delete)** | ✅ | — | `DELETE /tags/:id` | ProductTags 删除确认 | ✅ |
| **查 (List)** | ✅ | `TagQuery` | `GET /tags` | ProductTags 分页 Table | ✅ |
| **改 (Update)** | ✅ | `UpdateTagInput` | `PUT /tags/:id` | ProductTags 编辑 Dialog | ✅ |
| **商品 ⇔ 标签绑定** | `product_tag_relations` | `BindProductToTagInput` / `BindTagToProductInput` | `POST /tags/:id/products` `{productIds[]}` + `POST /products/:id/tags` `{tagIds[]}` | ProductBindingSheet + TagsPanel + AddTagDialog | ✅ |
| **商品 ⇔ 标签解绑** | 🗑️ CASCADE on tag delete | `UnbindProductFromTagInput` / `UnbindTagFromProductInput` | `DELETE /tags/:id/products` `{productIds[]}` + `DELETE /products/:id/tags` `{tagIds[]}` | Both sides with confirm Dialog | ✅ |
| **列表含绑定计数** | 子查询 `boundCount` | `ProductTag.boundCount?` | `GET /tags` 返回 `boundCount` | Table 列展示 | ✅ |
| **商品列表含标签** | Join 关联表 | `Product.tags[]` | `GET /products` 附带 `tags[]` | Product list 中展示 | ✅ |
| **错误处理** | — | — | 10 个专用错误码 | toast 提示 | ✅ |

### 缺失/不足

1. **`getProductOptions` 未在 API 层单独暴露为 tag 相关** — 这是产品侧功能，不直接影响标签管理
2. **无标签排序支持** — 标签列表按 `id` 升序排列，无手动排序功能
3. **删除标签时** 虽然同步删除了关联关系，但没有级联操作日志或确认弹窗显示影响范围

### 总体结论

**商品标签实体的增、删、查、改、绑定/解绑操作已全部实现，功能完整完善。** 从 DB Schema → Shared Types → API Routes → Error Codes → Frontend Pages → Service Layer 各层覆盖一致，前后端接口对齐。实现了标签-商品的双向批量绑定/解绑管理（从标签侧批量绑定/解绑商品，从商品侧批量绑定/解绑标签），前端以单次调用传入单元素数组的方式保持交互简洁，后端端点支持一次提交多个 ID 批量操作。商品列表和标签列表中分别展示关联数据。
