# 单实体 CRUD 接口完备性审计报告

**日期:** 2026-06-28
**目标:** 检查 4 个核心实体（员工、商品、客制化、门店）单表增查改功能，不涉及关联关系
**范围:** API 路由 ↔ 前端服务 ↔ 前端页面 三方对齐

---

## 1. 员工 (Employees / Users)

| 维度 | 路径/文件 | 状态 |
|------|-----------|------|
| **API 路由** | `apps/api/src/routes/users.ts` | ✅ |
| **前端页面** | `apps/web/src/pages/Employees/index.tsx` | ✅ 单页 CRUD |
| **前端服务** | `apps/web/src/services/user.ts` | ✅ |

### API 端点清单

| 方法 | 路径 | 用途 | 状态 |
|------|------|------|------|
| `GET` | `/users` | 列表（分页 + 关键词搜索） | ✅ |
| `POST` | `/users` | 新增（返回初始密码） | ✅ |
| `PUT` | `/users/:id` | 更新（email, displayName, status） | ✅ |
| `PATCH` | `/users/:id/status` | 启用/禁用切换 | ✅ |

### 增查改评估

| 操作 | 端点 | 说明 |
|------|------|------|
| **Create** | `POST /users` | 自动生成 12 位随机密码，argon2 哈希存储 |
| **Read (List)** | `GET /users` | 分页，支持 email/displayName 模糊搜索 |
| **Read (Detail)** | — | **无需独立详情接口**。前端在列表弹窗中直接编辑，列表已返回完整字段（id, email, displayName, status），数据足够 |
| **Update** | `PUT /users/:id` | 邮箱唯一性校验（排除自身），完整更新字段 |
| **Delete** | `PATCH /users/:id/status` | 软禁用（status=0），无物理删除 |

**结论: ✅ 完全满足。** 前端采用列表弹窗编辑模式，不依赖独立详情接口，现有端点完全覆盖。

---

## 2. 商品 (Products)

| 维度 | 路径/文件 | 状态 |
|------|-----------|------|
| **API 路由** | `apps/api/src/routes/products.ts` | ✅ |
| **前端页面** | `apps/web/src/pages/Products/` | ✅ index.tsx + detail.tsx |
| **前端服务** | `apps/web/src/services/product.ts` | ✅ |

### API 端点清单（仅核心 CRUD）

| 方法 | 路径 | 用途 | 状态 |
|------|------|------|------|
| `GET` | `/products` | 列表（分页 + 关键词搜索，含 tags 关联） | ✅ |
| `POST` | `/products` | 新增（含标签绑定） | ✅ |
| `GET` | `/products/:id/basic-info` | 详情 | ✅ |
| `PUT` | `/products/:id` | 更新（name/brief/description/price/status） | ✅ |

### 增查改评估

| 操作 | 端点 | 说明 |
|------|------|------|
| **Create** | `POST /products` | 支持 name/brief/description/price/status/tagIds |
| **Read (List)** | `GET /products` | 分页，关键词搜索，自动加载关联标签 |
| **Read (Detail)** | `GET /products/:id/basic-info` | 返回商品所有字段 + 标签数组 |
| **Update** | `PUT /products/:id` | 支持部分更新，仅传入非 undefined 字段 |
| **Delete** | — | **无专用删除/状态接口**。通过 `PUT /products/:id` 传递 `status` 字段实现上下架，前端 EditStatusDialog 也使用 `updateProduct`(PUT) 操作。但前端 Service (`toggleProductStatus`, `PATCH /products/:id/status`) 定义为未使用函数，不影响实际功能 |

**结论: ✅ 完全满足。** 核心增查改端点均已实现，详情使用 `/basic-info` 子路径。Service 中未用的 `toggleProductStatus` 函数不会造成运行时错误，建议后续清理。

---

## 3. 客制化 (Product Customizations)

| 维度 | 路径/文件 | 状态 |
|------|-----------|------|
| **API 路由** | `apps/api/src/routes/product-customizations.ts` | ✅ |
| **前端页面** | `apps/web/src/pages/Customization/` | ✅ index.tsx + detail.tsx |
| **前端服务** | `apps/web/src/services/product-customization.ts` | ✅ |

### API 端点清单（核心 CRUD）

| 方法 | 路径 | 用途 | 状态 |
|------|------|------|------|
| `GET` | `/product-customizations` | 列表（分页 + 关键词/状态筛选，含 boundCount, optionCount） | ✅ |
| `GET` | `/product-customizations/:id` | 详情 | ✅ |
| `POST` | `/product-customizations` | 创建（name/displayName） | ✅ |
| `PATCH` | `/product-customizations/:id` | 更新（name/displayName/status） | ✅ |

### 增查改评估

| 操作 | 端点 | 说明 |
|------|------|------|
| **Create** | `POST /product-customizations` | 创建后立即查询返回完整对象 |
| **Read (List)** | `GET /product-customizations` | 含绑定商品数(boundCount)和选项数(optionCount)子查询 |
| **Read (Detail)** | `GET /product-customizations/:id` | 返回完整字段 |
| **Update** | `PATCH /product-customizations/:id` | 更新 name/displayName/status，返回更新后对象 |
| **Delete** | — | 通过 status 状态字段软下架 |

### 选项子实体（额外验证）

| 方法 | 路径 | 状态 |
|------|------|------|
| `GET` | `/product-customizations/:id/options` | ✅ 列表 |
| `POST` | `/product-customizations/:id/options` | ✅ 创建 |
| `PUT` | `/product-customizations/:id/options/:optionId` | ✅ 更新 |
| `DELETE` | `/product-customizations/:id/options/:optionId` | ✅ 删除 |

**结论: ✅ 完全满足。** 核心实体和子实体（选项）均有完整 CRUD 支持。

---

## 4. 门店 (Stores)

| 维度 | 路径/文件 | 状态 |
|------|-----------|------|
| **API 路由** | `apps/api/src/routes/stores.ts` | ✅ |
| **前端页面** | `apps/web/src/pages/Stores/` | ✅ index.tsx + detail.tsx |
| **前端服务** | `apps/web/src/services/store.ts` | ✅ |

### API 端点清单（核心 CRUD）

| 方法 | 路径 | 用途 | 状态 |
|------|------|------|------|
| `GET` | `/stores` | 列表（分页 + 关键词搜索名称/电话/地址） | ✅ |
| `GET` | `/stores/:id` | 详情 | ✅ |
| `POST` | `/stores` | 新增（含地理编码 + 初始密码） | ✅ |
| `PUT` | `/stores/:id` | 更新（全部基础字段 + 状态 + 坐标） | ✅ |

### 增查改评估

| 操作 | 端点 | 说明 |
|------|------|------|
| **Create** | `POST /stores` | account 唯一校验，自动地理编码，Redis geo 同步 |
| **Read (List)** | `GET /stores` | 分页，关键词匹配 name/phone/address |
| **Read (Detail)** | `GET /stores/:id` | 返回完整门店信息 |
| **Update** | `PUT /stores/:id` | 全字段更新，也可通过 PATCH 子端点分步更新 |
| **Delete** | — | 软删除：状态变为 `CLOSED(3)` |

### 附加操作端点

| 方法 | 路径 | 用途 | 状态 |
|------|------|------|------|
| `PATCH` | `/stores/:id/status` | 更新状态 | ✅ |
| `PATCH` | `/stores/:id/basic-info` | 更新基础信息 | ✅ |
| `PATCH` | `/stores/:id/location` | 更新位置（含 Redis 同步） | ✅ |
| `POST` | `/stores/:id/reset-password` | 重置密码 | ✅ |
| `POST` | `/stores/sync-locations` | 批量同步 Redis 定位 | ✅ |

**结论: ✅ 完全满足。** 四实体中接口最完善，核心 CRUD + 多种细分更新操作 + 运维接口均完备。

---

## 总体总结

| 实体 | API 路由 | 增(C) | 查(R)列表 | 查(R)详情 | 改(U) | 删(D) | 前端匹配 | 结论 |
|------|----------|-------|-----------|----------|-------|-------|---------|------|
| **员工(Users)** | `users.ts` | ✅ | ✅ | ➖(不需) | ✅ | ✅软禁用 | ✅ | ✅ |
| **商品(Products)** | `products.ts` | ✅ | ✅ | ✅ | ✅ | ✅软删除 | ✅ | ✅ |
| **客制化(Customizations)** | `product-customizations.ts` | ✅ | ✅ | ✅ | ✅ | ✅软下架 | ✅ | ✅ |
| **门店(Stores)** | `stores.ts` | ✅ | ✅ | ✅ | ✅+ | ✅软注销 | ✅ | ✅ |

### 发现的次要问题（不影响功能）

1. **Service 中存在未使用的 `toggleProductStatus`**
   - `apps/web/src/services/product.ts` 第 42-46 行定义了 `toggleProductStatus`，调用 `PATCH /products/:id/status`
   - 此 API 端点在 `products.ts` 中 **未实现**
   - 但前端实际调用使用的是 `updateProduct`（`PUT /products/:id`），运行时不受影响
   - **建议:** 移除未使用的 Service 函数，或实现对应的 PATCH 端点

2. **各实体均无物理删除接口**
   - 员工/商品/客制化/门店均使用状态字段实现软删除/禁用
   - 门店有 `CLOSED` 状态，商品有 `OFF/下架`，用户有 `DISABLED/禁用`
   - 这是项目一致的设计模式，非缺陷

### 数据流一致性

所有 4 个实体的数据流均保持一致:
```
前端 Page (index.tsx / detail.tsx)
  → Service (services/*.ts)
    → HTTP call (services/http.ts axios 实例)
      → API Route (api/src/routes/*.ts)
        → DB Query (drizzle ORM)
```
