---
name: api-coding-style
description: dextea-admin 后端 API 编码规范。涵盖 shared-types 统一接口定义、errorcode 层错误码管理、路由 handler 的 try/catch 与 AppError 使用规范。
---

# dextea-admin 后端 API 编码规范

本 skill 定义了 dextea-admin 项目中 Fastify 后端接口的统一编码风格，主要覆盖三个层次：

| 层次 | 位置 | 职责 |
|---|---|---|
| **Shared Types** | `packages/shared-types/src/` | 定义 API 响应结构、请求/响应接口、业务状态类型 |
| **ErrorCode 层** | `apps/api/src/errorcode/` | 定义业务错误码（code + message + httpStatus） |
| **路由 Handler** | `apps/api/src/routes/` | 实现具体业务逻辑，使用 AppError 处理错误 |

---

## 一、ApiResponse — 统一响应结构 (shared-types)

所有接口响应必须使用 `ApiResponse<T>` 包装，位于 `packages/shared-types/src/types/api-response.ts`：

```typescript
export interface ApiResponse<T = unknown> {
  code: number;    // 业务状态码，0=成功，非0=具体错误码
  data: T;         // 响应数据（失败时一般传 null）
  message: string; // 提示消息（前端直接展示用）
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;
```

**规则：**
- `code: 0` 固定表示成功，非零值使用 errorcode 层定义的具体业务码
- 分页响应必须使用 `PaginatedResponse<T>`，后端通过 `PaginatedData<T>` 构造
- **`HealthResponse`** 是 `ApiResponse<HealthData>` 的别名，数据部分通过 `HealthData` 访问

### HTTP 状态码约定（核心）

| 场景 | HTTP 状态码 | 说明 |
|---|---|---|
| 业务成功 | `200` | JSON body 中 `code: 0` |
| 业务错误（参数错误、资源不存在、密码错误等） | `200` | JSON body 中 `code !== 0`，错误信息在 `message` 字段 |
| 系统级错误（DB 连接异常、OOM 等） | `500` | 由 Global Error Handler 自动处理，兜底 |
| 接口不存在 | `404` | Fastify 默认行为，无需手动处理 |
| Fastify 内置 Schema 校验失败 | `200` | 返回 `code: 10004`（INVALID_REQUEST） |

**禁止使用 `201`、`400`、`403` 等业务 HTTP 状态码。** HTTP 状态码仅表示传输层状态，业务层的成功/失败统一通过 JSON body 中的 `code` 字段传达。

---

## 二、Status — 业务状态类型定义 (shared-types)

每个有状态字段的业务实体，均在 `packages/shared-types/src/status/` 下按以下模式定义。

### 已注册的模块

| 文件 | 模块 | 状态值 | 用途 |
|---|---|---|---|
| `user.ts` | 用户状态 | `0=禁用` `1=激活` | `USER_STATUS` |
| `store.ts` | 门店状态 | `0=休息中` `1=营业中` `2=筹备中` `3=已注销` | `STORE_STATUS` |
| `product.ts` | 商品状态 | `0=下架` `1=可售` | `PRODUCT_STATUS` |
| `product-customization.ts` | 客制化项目状态 | `0=下架` `1=启用` | `PRODUCT_CUSTOMIZATION_STATUS` |
| `customization-option.ts` | 客制化选项状态 | `0=下架` `1=启用` | `CUSTOMIZATION_OPTION_STATUS` |

### 规范模板

```typescript
// packages/shared-types/src/status/product-customization.ts

/**
 * 客制化项目状态
 * 0=下架  1=启用
 */

export const PRODUCT_CUSTOMIZATION_STATUS = {
  OFF: { key: 'off', value: 0 },
  ON: { key: 'on', value: 1 },
} as const;

export type ProductCustomizationStatus = number;

export const PRODUCT_CUSTOMIZATION_STATUS_VALUES: readonly ProductCustomizationStatus[] = [0, 1];
```

**规则：**
- 常量名 `XXX_STATUS`（全大写 + 下划线）
- 每个枚举项使用 `{ key, value }` 结构，`key` 用于前端标识，`value` 存储到数据库
- 类型用 `type XxxStatus = number`（**禁止用 enum**，web 侧 `erasableSyntaxOnly: true` 禁止 enum）
- 提供 `XXX_STATUS_VALUES: readonly XxxStatus[]` 数组，用于校验入参是否合法
- 注释头标明每个数字对应的业务含义

### 在 barrel 中导出

```typescript
// packages/shared-types/src/status/index.ts
export { PRODUCT_CUSTOMIZATION_STATUS, PRODUCT_CUSTOMIZATION_STATUS_VALUES } from './product-customization.js';
export type { ProductCustomizationStatus } from './product-customization.js';

// packages/shared-types/src/index.ts
// ---- status layer ----
export { PRODUCT_CUSTOMIZATION_STATUS, PRODUCT_CUSTOMIZATION_STATUS_VALUES } from './status/index.js';
export type { ProductCustomizationStatus } from './status/index.js';
```

---

## 三、Types — 请求/响应接口定义 (shared-types)

每个业务模块在 `packages/shared-types/src/types/` 下定义请求体和响应体的 TypeScript 接口。

### 已注册的模块

| 文件 | 模块 |
|---|---|
| `api-response.ts` | 通用 ApiResponse、PaginatedData |
| `health.ts` | 健康检查 |
| `init.ts` | 系统初始化 |
| `auth.ts` | 认证（登录/登出） |
| `user.ts` | 用户管理 CRUD |
| `store.ts` | 门店管理 CRUD |
| `area.ts` | 地区服务 |
| `config.ts` | 系统配置 |
| `product.ts` | 商品管理 |
| `tag.ts` | 商品标签 |
| `product-customization.ts` | 客制化项目 |
| `customization-option.ts` | 客制化选项 |
| `order.ts` | 订单（预留） |
| `dashboard.ts` | 仪表盘统计 |

### 新增模块响应类型示例

```typescript
// packages/shared-types/src/types/product-customization.ts

import type { ApiResponse } from './api-response.js';
import type { ProductCustomizationStatus } from '../status/index.js';

export interface ProductCustomization {
  id: number;
  name: string;
  displayName: string;
  status: ProductCustomizationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductCustomizationInput {
  name: string;
  displayName: string;
}

export interface ProductCustomizationQuery {
  page?: string;
  pageSize?: string;
}

// 响应类型：数据部分 = 完整对象，外层由 ApiResponse 包裹
// 路由中用 `Reply: ApiResponse<ProductCustomization>`
```

**约定：**
- 查询参数（query string）统一用 `XxxQuery` 命名，字段全部 `string`（从 query 解析后自行转换）
- 请求体用 `XxxInput` 命名，对应 `POST/PUT` body
- 响应体不需要额外命名——路由中直接用 `Reply: ApiResponse<EntityType>` 或 `Reply: ApiResponse<{ id: number }>`
- 特殊聚合响应（如 `LoginResponse`）用 `XxxResponse` 命名，定义为完整 `ApiResponse<Data>` 类型

### 在 barrel 中导出

```typescript
// packages/shared-types/src/types/index.ts
export type { ProductCustomization, CreateProductCustomizationInput, ProductCustomizationQuery } from './product-customization.js';

// packages/shared-types/src/index.ts
// ---- types layer ----
export type { ProductCustomization, CreateProductCustomizationInput, ProductCustomizationQuery } from './types/index.js';
```

---

## 四、ErrorCode 层 — 业务错误码 (apps/api)

### 错误码范围

所有错误码统一使用 5 位 `1xxxx` 格式（前两位标识模块，后三位标识具体错误）：

| 范围 | 模块 | 实际 code 示例 |
|---|---|---|
| 10000-10099 | 系统级通用错误 | `10000`=服务器内部错误 |
| 10100-10199 | 认证模块 | `10100`=账号或密码错误 |
| 10200-10299 | 用户管理 | `10202`=用户不存在 |
| 10300-10399 | 门店管理 | `10301`=门店不存在 |
| 10400-10499 | 地区服务 | `10400`=获取省份列表失败 |
| 10500-10599 | 系统初始化 | `10500`=系统已初始化 |
| 10600-10699 | 系统配置 | `10600`=获取配置失败 |
| 10700-10799 | 商品标签 | `10701`=标签不存在 |
| 10800-10899 | 商品管理 | `10801`=商品不存在 |
| 10900-10999 | 客制化项目 | `10901`=客制化项目不存在 |

新增模块取下一个可用范围（如 `11000-11099`），避免重复。

### httpStatus 规则

所有业务错误码的 `httpStatus` 统一为 `200`：

- HTTP 状态码仅用于表示传输层状态：`200` 正常、`500` 系统级错误、`404` 接口不存在
- **业务层的错误/失败**（参数不合法、密码错误、资源不存在、操作失败等）统一返回 HTTP 200，错误信息通过 JSON body 中的 `code` 字段传达
- Global Error Handler 兜底逻辑：非 `AppError` 的未捕获异常返回 `reply.status(500)`

### 核心类型定义 (errorcode/index.ts)

```typescript
export interface BizError {
  code: number;
  message: string;
  httpStatus: number;  // 业务错误统一 200，系统错误 500
}

export class AppError extends Error {
  public readonly code: number;
  public readonly httpStatus: number;

  constructor(bizError: BizError, detail?: string) {
    super(detail ?? bizError.message);
    this.name = 'AppError';
    this.code = bizError.code;
    this.httpStatus = bizError.httpStatus;
  }

  /** 转换为 API 响应体 */
  toResponse() {
    return {
      code: this.code,
      data: null,
      message: this.message,
    };
  }
}
```

### 模块错误码文件模板

```typescript
// apps/api/src/errorcode/product-customizations.ts

import type { BizError } from './index.js';

/**
 * 客制化项目错误码 (10900-10999)
 */
export const productCustomizationErrors = {
  NAME_REQUIRED: {
    code: 10900,
    message: '请输入客制化项目名称',
    httpStatus: 200,
  } satisfies BizError,

  NOT_FOUND: {
    code: 10901,
    message: '客制化项目不存在',
    httpStatus: 200,
  } satisfies BizError,

  LIST_FAILED: {
    code: 10902,
    message: '获取客制化项目列表失败',
    httpStatus: 200,
  } satisfies BizError,

  // ...更多错误码
} as const satisfies Record<string, BizError>;
```

**命名约定：**
- 常量名 `xxxErrors`（小驼峰）
- 错误 key 使用全大写 `SCREAMING_SNAKE_CASE`
- 每个条目 `satisfies BizError` + 整体 `as const satisfies Record<string, BizError>`
- `httpStatus` 一律填 `200`（业务错误），系统级错误填 `500`

### 在 errorcode/index.ts 中注册

```typescript
export { productCustomizationErrors } from './product-customizations.js';
```

---

## 五、路由 Handler — 编码规范

### 完整路由模板

```typescript
import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { productCustomizationsTable } from '../db/schema.js';
import { AppError } from '../errorcode/index.js';
import { productCustomizationErrors } from '../errorcode/product-customizations.js';
import { parsePositiveInt, validateMaxLength } from '../utils/validation.js';
import type {
  ApiResponse,
  PaginatedData,
  ProductCustomization,
  CreateProductCustomizationInput,
  ProductCustomizationQuery,
} from '@dextea/shared-types';

export async function productCustomizationRoutes(app: FastifyInstance) {
  /**
   * 客制化项目列表
   * url: /api/v1/product-customizations
   */
  app.get<{
    Querystring: ProductCustomizationQuery;
    Reply: ApiResponse<PaginatedData<ProductCustomization>>;
  }>('/product-customizations', {
    schema: { /* ... 文档 schema */ },
  }, async (request) => {
    try {
      const db = await getDb();
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(productCustomizationsTable);

      const total = Number(countResult[0]?.count ?? 0);

      const items = await db
        .select()
        .from(productCustomizationsTable)
        .orderBy(productCustomizationsTable.id)
        .limit(pageSize)
        .offset(offset);

      return {
        code: 0,
        data: { items, total, page, pageSize },
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productCustomizationErrors.LIST_FAILED);
    }
  });

  /**
   * 新增客制化项目
   * url: /api/v1/product-customizations
   */
  app.post<{
    Body: CreateProductCustomizationInput;
    Reply: ApiResponse<ProductCustomization>;
  }>('/product-customizations', {
    schema: { /* ... */ },
  }, async (request) => {
    try {
      const db = await getDb();
      const { name, displayName } = request.body;

      validateMaxLength(name, 255, '客制化项目名称');
      validateMaxLength(displayName, 255, '展示名称');

      // 检查名称重复（如有必要）
      // const [existing] = await db...
      // if (existing) throw new AppError(...)

      const result = await db.insert(productCustomizationsTable).values({
        name, displayName,
      });

      const insertId = Number(result[0]?.insertId ?? 0);
      const [created] = await db.select()
        .from(productCustomizationsTable)
        .where(eq(productCustomizationsTable.id, insertId))
        .limit(1);

      return {
        code: 0,
        data: created,
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productCustomizationErrors.CREATE_FAILED);
    }
  });
}
```

### 路由规范要点

1. **HTTP 状态码约定**
   - **所有业务响应**（成功或失败）统一返回 `200`。业务错误码（`code` 字段非 0）在 JSON body 中传达
   - `500` 仅用于系统级错误（数据库连接异常、OOM 等），由 Global Error Handler 自动处理
   - `404` 仅用于接口不存在（Fastify 默认行为），不要手动返回 404
   - 禁止使用 `reply.code(201)`、`reply.code(400)` 等业务 HTTP 状态码

2. **方法选择**
   - `GET` — 列表/详情查询（无副作用）
   - `POST` — 创建资源
   - `PUT` — 全量更新资源
   - `PATCH` — 部分更新（如状态变更）
   - `DELETE` — 删除资源

3. **泛型参数**：始终显式标注 `Body`、`Querystring`、`Params`、`Reply` 泛型，确保类型检查

4. **分页参数**：始终使用 `Math.max(1, ...)` / `Math.min(100, Math.max(1, ...))` 做防御性校验，pageSize 上限 100

5. **错误处理 — try/catch 模式** （核心）：
   ```typescript
   try {
     // 业务逻辑
   } catch (error) {
     if (error instanceof AppError) throw error;  // 已知业务错误透传
     request.log.error(error);                     // 未知错误打日志
     throw new AppError(someErrors.XXX_FAILED);    // 包装为业务错误上抛
   }
   ```
   - `instanceof AppError` 的检查确保已知错误不会被二次包装
   - 未知错误必须 `request.log.error(error)` 记录完整堆栈
   - 即使是简单路由（如纯读取）也建议使用 try/catch，保持风格统一

6. **成功响应格式**：
   ```typescript
   { code: 0, data: ..., message: 'ok' }
   ```
   - `code: 0` 固定
   - `data` 字段精确对应 `Reply` 泛型
   - `message` 见文知意（中文消息）

7. **Schema 校验**：简单校验（必填字段、存在性）在 handler 内用 `if (!field) throw AppError` 快速失败；复杂校验使用 Zod 等 schema 工具（如需），但当前项目暂无统一 schema 方案

---

## 六、Utilities 工具函数

### 参数校验 (apps/api/src/utils/validation.ts)

所有校验函数抛出 `new AppError(systemErrors.VALIDATION_ERROR, detail)`，httpStatus=200：

| 函数 | 用途 |
|---|---|
| `parsePositiveInt(val, name)` | 将字符串解析为正整数，失败抛 `VALIDATION_ERROR` |
| `validateRequired(val, name)` | 校验必填字段 |
| `validateEmail(val, name?)` | 校验邮箱格式 |
| `validatePassword(val)` | 校验密码强度 |
| `validatePhone(val, name?)` | 校验手机号格式 |
| `validateMaxLength(val, max, name)` | 校验最大长度 |
| `validateStatus(val, validValues, name)` | 校验状态值在合法范围内 |
| `validatePrice(val)` | 校验价格正数 |
| `validateLongitude(val)` / `validateLatitude(val)` | 校验经纬度范围 |

### 密码工具 (apps/api/src/utils/password.ts)

| 函数 | 用途 |
|---|---|
| `hashPassword(password)` | argon2 哈希 |
| `verifyPassword(password, hash)` | 验证密码 |

---

## 七、Auth 中间件 (apps/api/src/middleware/auth.ts)

所有路由（除白名单外）自动校验 Bearer token：

```typescript
// 白名单路径（不需要 token）
const AUTH_WHITELIST = [
  '/health',
  '/api/v1/auth/login',
  '/api/v1/init',
  '/api/v1/docs',
] as const;
```

- Token 存储在 Redis，key 格式 `dextea:admin:token:{uuid}`，TTL 30 分钟
- 校验失败返回 `{ code: 10103, data: null, message: '未提供有效的认证令牌' }`，HTTP 200
- 通过 `request.authUser` 注入用户信息（`{ userId, email, displayName }`）

---

## 八、Global Error Handler（位于 apps/api/src/app.ts）

自动捕获所有路由中抛出的异常，无需在每个路由中手动 `reply.send()`。实际代码有 **4 个分支**：

```typescript
app.setErrorHandler((error, request, reply) => {
  // Branch 1 — AppError（已知业务错误）
  if (error instanceof AppError) {
    request.log.warn({ code: error.code, err: error.message }, 'AppError');
    return reply.status(error.httpStatus).send(error.toResponse());
  }

  // Branch 2 — Duck-type 结构匹配（跨插件边界的 AppError 对象）
  if (
    error && typeof error === 'object' &&
    'code' in error && 'httpStatus' in error &&
    typeof (error as AppError).toResponse === 'function'
  ) {
    const appErr = error as AppError;
    return reply.status(appErr.httpStatus).send(appErr.toResponse());
  }

  // Branch 3 — Fastify Schema 校验失败（返回 200 + INVALID_REQUEST）
  const fErr = error as FastifyError;
  if (fErr.validation) {
    return reply.status(200).send({
      code: systemErrors.INVALID_REQUEST.code,  // 10004
      data: null,
      message: fErr.message,
    });
  }

  // Branch 4 — 未捕获异常（兜底，返回 500）
  request.log.error(error);
  return reply.status(500).send({
    code: systemErrors.INTERNAL_ERROR.code,  // 10000
    data: null,
    message: error instanceof Error ? error.message : systemErrors.INTERNAL_ERROR.message,
  });
});
```

---


## 九、Checklist — 新增模块自检

- [ ] 1. **Status 层** — `packages/shared-types/src/status/xxx.ts` 定义 `XXX_STATUS` + `XxxStatus` + `XXX_STATUS_VALUES`
- [ ] 2. **Types 层** — `packages/shared-types/src/types/xxx.ts` 定义 Entity + Input + Query 接口
- [ ] 3. **Barrel 导出** — 在 `status/index.ts`、`types/index.ts`、`src/index.ts` 分别导出
- [ ] 4. **ErrorCode 层** — `apps/api/src/errorcode/xxx.ts` 定义业务错误码（all `httpStatus: 200`），在 `index.ts` 导出
- [ ] 5. **DB Schema** — `apps/api/src/db/schema.ts` 定义表结构
- [ ] 6. **路由实现** — `apps/api/src/routes/xxx.ts` 实现 CRUD 接口
- [ ] 7. **全局注册** — 在 `routes/index.ts` 注册新路由
- [ ] 8. **类型检查** — `pnpm typecheck` 通过

---

## 十、文件全景图（新增模块需修改的文件）

```
packages/shared-types/src/
├── index.ts                          # + export/export type
├── status/
│   ├── index.ts                      # + export/export type
│   └── xxx.ts 🔺                     # 新建：XXX_STATUS + XxxStatus + XXX_STATUS_VALUES
└── types/
    ├── index.ts                      # + export type { ... }
    └── xxx.ts 🔺                     # 新建：Entity / Input / Query 接口

apps/api/src/
├── errorcode/
│   ├── index.ts                      # + export { xxxErrors }
│   └── xxx.ts 🔺                     # 新建：错误码定义（httpStatus: 200）
├── db/
│   └── schema.ts                     # + 表定义（可能已有）
└── routes/
    ├── index.ts                      # + registerRoutes 调用
    └── xxx.ts 🔺                     # 新建：路由 handler
```
