---
name: api-module-architecture
description: dextea-admin 后端模块架构规范。当需要修改或创建 apps/api/src/module 下的模块代码时，根据本技能规范开发。使用 Zod v4 做运行时校验、Drizzle ORM 做数据访问、FastifyPluginAsyncZod 做模块注册。
---

# dextea-admin 后端模块架构规范

本 skill 定义了 dextea-admin 项目中基于 **module** 层的新架构编码规范，参考 employees 模块实现。

## 架构总览

```
apps/api/src/module/{module}/
├── {module}.module.ts      # 入口：FastifyPluginAsyncZod，挂载路由
├── {module}.controller.ts  # 路由定义：Zod schema 校验 + ApiResponse 响应
├── {module}.type.ts        # Zod v4 schema + infer TS 类型（含请求/响应/实体）
├── {module}.repository.ts  # 数据访问层：Drizzle ORM 查询封装
├── {module}.service.ts     # 业务逻辑层：校验/判重/状态变更/调用 repository
└── {module}.errorcode.ts   # 错误码：static object + BizErrorCode 类型
```

## 一、模块入口 — `{module}.module.ts`

每个模块是一个独立的 Fastify 插件，使用 `FastifyPluginAsyncZod` 类型，在 `apps/api/src/index.ts` 中注册。

```typescript
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerXxxRoutes } from './xxx.controller.js';

export const registerXxxModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerXxxRoutes, { prefix: '/api/v1' });
};
```

**注册方式**（在 `apps/api/src/index.ts` 中）：

```typescript
import { registerXxxModule } from './module/xxx/xxx.module.js';
// ...
await app.register(registerXxxModule);
```

## 二、路由控制器 — `{module}.controller.ts`

使用 `FastifyPluginAsyncZod` 定义路由，利用 Fastify Zod 校验器自动做请求/响应校验。

```typescript
import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { xxxService } from './xxx.service.js';
import {
  XxxListRequestSchema, XxxListResponseSchema,
  XxxCreateRequestSchema, XxxCreateResponseSchema,
} from './xxx.type.js';

export const registerXxxRoutes: FastifyPluginAsyncZod = async (app) => {
  // 列表查询
  app.get(
    '/xxx',
    {
      schema: {
        tags: ['Xxx'],
        description: '获取列表',
        querystring: XxxListRequestSchema,
        response: { 200: ApiResponseSchema(XxxListResponseSchema).describe('列表') },
      },
    },
    async (request, _reply) => {
      const data = await xxxService.getXxxList(request.query);
      return ApiResponse.success(data);
    },
  );

  // 创建
  app.post(
    '/xxx',
    {
      schema: {
        tags: ['Xxx'],
        description: '新增',
        body: XxxCreateRequestSchema,
        response: { 200: ApiResponseSchema(XxxCreateResponseSchema).describe('创建成功') },
      },
    },
    async (request, _reply) => {
      const data = await xxxService.createXxx(request.body);
      return ApiResponse.success(data);
    },
  );

  // 更新
  app.put(
    '/xxx/:id',
    {
      schema: {
        tags: ['Xxx'],
        description: '更新',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: XxxUpdateRequestSchema,
        response: { 200: ApiResponseSchema(XxxUpdateResponseSchema).describe('更新成功') },
      },
    },
    async (request, _reply) => {
      const data = await xxxService.updateXxx(request.params.id, request.body);
      return ApiResponse.success(data);
    },
  );

  // 状态变更
  app.put(
    '/xxx/:id/status',
    {
      schema: {
        tags: ['Xxx'],
        description: '启用或禁用',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        response: { 200: ApiResponseSchema(XxxStatusResponseSchema).describe('操作结果') },
      },
    },
    async (request, _reply) => {
      const data = await xxxService.toggleXxxStatus(request.params.id);
      return ApiResponse.success(data);
    },
  );
};
```

**核心规则：**
- 路由 handler 中**不需要 try/catch** — 错误由 `BizError` 抛出，全局 error handler 统一捕获
- handler 只做"调用 service → 返回 `ApiResponse.success(data)`" 这一件事
- 路径参数使用 `z.coerce.number()` 做自动类型转换
- `ApiResponseSchema(T)` 自动生成 `{ code, message, data }` 外包装

## 三、类型定义 — `{module}.type.ts`

所有请求/响应/实体的类型定义集中在此文件，使用 **Zod v4 (`zod/v4`)** 定义 schema 并通过 `z.infer` 提取 TS 类型。

```typescript
import { z } from 'zod/v4';
import { PaginatedDataSchema } from '@/common/types/index.js';

// 状态枚举（可选。若数据库用数字表示分类/状态，则必须定义，作为数字含义的字典）

export const XXX_STATUS = {
  DISABLED: { key: 'disabled', value: 0 },
  ACTIVE:   { key: 'active',   value: 1 },
} as const;

export type XxxStatus = (typeof XXX_STATUS)[keyof typeof XXX_STATUS]['value'];
export const XXX_STATUS_VALUES: readonly XxxStatus[] = [0, 1];

// 实体

export const XxxSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Xxx = z.infer<typeof XxxSchema>;

// 列表查询

export const XxxListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
});
export type XxxListRequest = z.infer<typeof XxxListRequestSchema>;

export const XxxListResponseSchema = PaginatedDataSchema(XxxSchema);
export type XxxListResponse = z.infer<typeof XxxListResponseSchema>;

// 创建

export const XxxCreateRequestSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
});
export type XxxCreateRequest = z.infer<typeof XxxCreateRequestSchema>;

export const XxxCreateResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type XxxCreateResponse = z.infer<typeof XxxCreateResponseSchema>;

// 更新

export const XxxUpdateRequestSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
});
export type XxxUpdateRequest = z.infer<typeof XxxUpdateRequestSchema>;

export const XxxUpdateResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type XxxUpdateResponse = z.infer<typeof XxxUpdateResponseSchema>;

// 状态变更

export const XxxStatusResponseSchema = z.object({
  name: z.string(),
  status: z.number(),
});
export type XxxStatusResponse = z.infer<typeof XxxStatusResponseSchema>;
```

**核心规则：**
- **状态枚举**直接定义在 type 文件中（不是必须放在 shared-types），用 `const` + `as const` 模式，不用 `enum`。若数据库使用数字表示分类或状态（如 `0`=禁用, `1`=启用），则必须定义状态枚举，作为数字含义的字典
- **分页响应**使用 `PaginatedDataSchema(XxxSchema)` 通用包装
- **请求 schema** 中查询参数用 `z.coerce.number()` 自动转换 query string
- 所有 `z.string().min(1, ...)` 提供中文错误消息

## 四、数据访问层 — `{module}.repository.ts`

封装所有数据库操作，使用 Drizzle ORM，无业务逻辑。

```typescript
import { eq, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { xxxTable } from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/plugins/utils/pagination.js';

export const xxxRepository = {
  async getXxxList(page: number, pageSize: number, keyword?: string) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    keyword = keyword?.trim();

    const baseQuery = db
      .select({ /* 明确列出字段，不直接用 */.select() */ })
      .from(xxxTable)
      .orderBy(xxxTable.id)
      .$dynamic();

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(xxxTable);

    if (keyword) {
      const pattern = `%${keyword}%`;
      const filter = sql`(${xxxTable.name} like ${pattern})`;
      baseQuery.where(filter);
      countQuery.where(filter);
    }

    const [items, countResult] = await Promise.all([
      withPagination(baseQuery, page, pageSize),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return { items, total, page, pageSize };
  },

  async getXxxById(id: number) {
    const rows = await db
      .select()
      .from(xxxTable)
      .where(eq(xxxTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getXxxByField(field: string, value: string) {
    const rows = await db
      .select()
      .from(xxxTable)
      .where(eq(xxxTable[field as keyof typeof xxxTable], value))
      .limit(1);
    return rows[0] ?? null;
  },

  async createXxx(data: Record<string, unknown>) {
    const result = await db.insert(xxxTable).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateXxxById(id: number, data: Partial<typeof xxxTable.$inferInsert>) {
    await db
      .update(xxxTable)
      .set(data)
      .where(eq(xxxTable.id, id));
  },
};
```

**核心规则：**
- 方法名以 `get`/`create`/`update` 开头。获取列表用 `get{Entity}List`（如 `getEmployeeList`），获取单个用 `get{Entity}ById`（如 `getEmployeeById`），创建用 `create{Entity}`，更新用 `update{Entity}ById`
- 返回值统一为 `Plain Old Object` 或 `null`（不存在时），不抛业务异常
- 分页查询使用 `$dynamic()` + 条件拼装
- 使用 `withPagination` 工具处理 `limit`/`offset`

## 五、业务逻辑层 — `{module}.service.ts`

业务逻辑中转层，负责参数校验、存在性检查、判重、调用 repository。

```typescript
import { BizError } from '@/common/exceptions/index.js';
import { XxxErrorCodes } from './xxx.errorcode.js';
import { xxxRepository } from './xxx.repository.js';
import { validateEmail, validateMaxLength } from '@/plugins/utils/validation.js';
import { XXX_STATUS } from './xxx.type.js';
import type { XxxListRequest, XxxCreateRequest, XxxUpdateRequest } from './xxx.type.js';

export const xxxService = {
  async getXxxList(params: XxxListRequest) {
    return xxxRepository.getXxxList(params.page, params.pageSize, params.keyword);
  },

  async createXxx(input: XxxCreateRequest) {
    const { name } = input;

    // 校验
    validateMaxLength(name, 255, '名称');

    // 判重
    const existing = await xxxRepository.getXxxByField('name', name);
    if (existing) {
      throw new BizError(XxxErrorCodes.NAME_EXISTS);
    }

    // 创建
    const id = await xxxRepository.createXxx({ name, status: XXX_STATUS.DISABLED.value });

    return { id, name };
  },

  async updateXxx(id: number, input: XxxUpdateRequest) {
    const { name } = input;

    validateMaxLength(name, 255, '名称');

    const entity = await xxxRepository.getXxxById(id);
    if (!entity) {
      throw new BizError(XxxErrorCodes.NOT_FOUND);
    }

    const existing = await xxxRepository.getXxxByField('name', name);
    if (existing && existing.id !== id) {
      throw new BizError(XxxErrorCodes.NAME_EXISTS_OTHER);
    }

    await xxxRepository.updateXxxById(id, { name });

    return { id, name };
  },

  async toggleXxxStatus(id: number) {
    const entity = await xxxRepository.getXxxById(id);
    if (!entity) {
      throw new BizError(XxxErrorCodes.NOT_FOUND);
    }

    const newStatus =
      entity.status === XXX_STATUS.DISABLED.value
        ? XXX_STATUS.ACTIVE.value
        : XXX_STATUS.DISABLED.value;

    await xxxRepository.updateXxxById(id, { status: newStatus });

    return { name: entity.name, status: newStatus };
  },
};
```

**核心规则：**
- service 方法名遵循与 repository 相同的命名约定：`get`/`create`/`update` 开头，列表带 `List`，单个带 `ById`
- service 方法不要 `try/catch`，`BizError` 会自然传播到全局 error handler
- 校验优先使用 `@/plugins/utils/validation.ts` 中的工具函数
- 判重检查需要排除自身（`existing.id !== id`）
- 状态切换用三元表达式而非 if/else

## 六、错误码 — `{module}.errorcode.ts`

集中定义模块级错误码，使用 `as const satisfies Record<string, BizErrorCode>` 约束。

```typescript
import type { BizErrorCode } from '@/common/types';

/**
 * Xxx 模块错误码 (xxx00-xxx99)
 */
export const XxxErrorCodes = {
  NAME_EXISTS:       { code: xxx00, message: '名称已被使用' },
  NOT_FOUND:         { code: xxx01, message: '不存在' },
  NAME_EXISTS_OTHER: { code: xxx02, message: '该名称已被其他记录使用' },
  LIST_FAILED:       { code: xxx03, message: '获取列表失败' },
  CREATE_FAILED:     { code: xxx04, message: '创建失败' },
  UPDATE_FAILED:     { code: xxx05, message: '更新失败' },
  OPERATE_FAILED:    { code: xxx06, message: '操作失败' },
} as const satisfies Record<string, BizErrorCode>;
```

**错误码范围分配：**

| 范围 | 模块 |
|---|---|
| 10000-10099 | 系统级通用 |
| 10100-10199 | 认证模块 |
| 10200-10299 | 员工管理 |
| 10300-10399 | ... |

新增模块取下一个可用百位范围。

## 七、共享基础设施

### ApiResponse (位于 `@/common/types/`)

```typescript
// 响应包装
ApiResponseSchema(T) → z.object({ code: z.number(), message: z.string(), data: T.nullable() })

// 响应构造
ApiResponse.success(data)        → { code: 0, message: 'success', data }
ApiResponse.error(code, message) → { code, message, data: null }

// 分页包装
PaginatedDataSchema(T) → z.object({ items: T[], total, page, pageSize })
```

### BizError (位于 `@/common/exceptions/`)

```typescript
new BizError(bizErrorCode: BizErrorCode, detail?: string, httpStatus = 400)
```

- 不传 `httpStatus` 默认 400，全局 error handler 自动捕获
- `BizErrorCode` 类型：`{ code: number; message: string }`

### 全局 Error Handler (位于 `apps/api/src/index.ts`)

- **BizError** → `reply.status(400).send(ApiResponse.error(...))`
- **Fastify 验证错误** → `reply.status(400).send(ApiResponse.error(400, error.message))`
- **未知错误** → `reply.status(500).send(...)` + log

### 工具函数 (位于 `@/plugins/utils/`)

| 函数 | 用途 |
|---|---|
| `validateEmail(email)` | 校验邮箱格式 |
| `validateMaxLength(val, max, name)` | 校验最大长度 |
| `validateRequired(val, name)` | 校验必填字段 |
| `validatePassword(val)` | 校验密码强度 |
| `validateStatus(val, validValues, name)` | 校验状态值 |
| `withPagination(qb, page, pageSize)` | Drizzle 分页 |
| `hashPassword(pwd)` / `verifyPassword(pwd, hash)` | argon2 密码处理 |

## 八、Checklist — 新增模块自检

- [ ] 1. **模块目录** — `apps/api/src/module/{module}/` 创建 6 文件
- [ ] 2. **DB Schema** — `apps/api/src/plugins/db/mysql/schema.ts` 如果新增表
- [ ] 3. **类型定义** — `{module}.type.ts` 定义实体/请求/响应 Zod schema
- [ ] 4. **错误码** — `{module}.errorcode.ts` 定义模块错误码
- [ ] 5. **数据访问** — `{module}.repository.ts` 实现 CRUD
- [ ] 6. **业务逻辑** — `{module}.service.ts` 校验/判重/状态变更
- [ ] 7. **路由控制** — `{module}.controller.ts` 注册路由 handler
- [ ] 8. **模块入口** — `{module}.module.ts` FastifyPluginAsyncZod 导出
- [ ] 9. **全局注册** — 在 `apps/api/src/index.ts` 中 `app.register(registerXxxModule)`
- [ ] 10. **类型检查** — `pnpm typecheck` 通过

## 九、模块文件全景图

```
apps/api/src/
├── index.ts                              # registerXxxModule() 调用
├── common/
│   ├── types/
│   │   ├── index.ts                      # ApiResponse, ApiResponseSchema, PaginatedDataSchema
│   │   ├── api-response.interface.ts
│   │   ├── biz-error-code.interface.ts
│   │   └── paginated.interface.ts
│   └── exceptions/
│       ├── index.ts                      # re-export BizError
│       └── biz-error.exception.ts        # BizError class
├── plugins/
│   ├── db/mysql/
│   │   ├── index.ts                      # drizzle db instance
│   │   └── schema.ts                     # 所有表定义
│   └── utils/
│       ├── pagination.ts                 # withPagination
│       ├── validation.ts                 # 校验函数
│       └── password.ts                   # argon2 密码工具
└── module/
    ├── system/system.errorcode.ts        # 系统级错误码
    └── {module}/                         # 🔺 新建模块
        ├── {module}.module.ts
        ├── {module}.controller.ts
        ├── {module}.type.ts
        ├── {module}.repository.ts
        ├── {module}.service.ts
        └── {module}.errorcode.ts
```
