---
name: api-coding-style
description: dextea-admin 后端 API 编码规范。涵盖 shared-types 统一接口定义、errorcode 层错误码管理、路由 handler 的 try/catch 与 AppError 使用规范。
---

# dextea-admin 后端 API 编码规范

本 skill 定义了 dextea-admin 项目中 Fastify 后端接口的统一编码风格，主要覆盖三个层次：

| 层次 | 位置 | 职责 |
|---|---|---|
| **Shared Types** | `packages/shared-types/src/types/` | 定义 API 请求/响应 JSON 结构（接口类型） |
| **Status Layer** | `packages/shared-types/src/status/` | 定义业务状态类型（枚举常量 + 标签映射） |
| **ErrorCode 层** | `apps/api/src/errorcode/` | 定义业务错误码（code + message + httpStatus） |

---

## 一、ApiResponse — 统一响应结构 (shared-types)

所有接口响应必须使用 `ApiResponse<T>` 包装，位于 `packages/shared-types/src/types/api-response.ts`：

```typescript
// ====== 通用 API 响应 ======

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
- 新模块的响应类型统一以 `XxxResponse` 命名，放入对应模块的 `types/*.ts` 文件

### 新增模块响应类型示例

```typescript
// packages/shared-types/src/types/employee.ts

import type { ApiResponse } from './api-response.js';

export interface Employee {
  id: number;
  name: string;
  phone: string;
  status: EmployeeStatus;
  createdAt: string;
}

export interface CreateEmployeeInput {
  name: string;
  phone: string;
}

export type CreateEmployeeResponse = ApiResponse<{ id: number }>;

export type EmployeeQuery = {
  page?: string;
  pageSize?: string;
  name?: string;
};
```

然后在 `types/index.ts` 的 barrel 中导出：

```typescript
export type { Employee, CreateEmployeeInput, CreateEmployeeResponse, EmployeeQuery } from './employee.js';
```

---

## 二、Status — 业务状态类型定义 (shared-types)

每个有状态字段的业务实体，按如下模式定义在 `packages/shared-types/src/status/` 下。

### 规范模板

```typescript
// packages/shared-types/src/status/employee.ts

// ====== 员工状态 ======
// 0=在职  1=离职  2=休假
// ──────────────────────────────

export type EmployeeStatus = 0 | 1 | 2;

export const EMPLOYEE_STATUS = {
  ACTIVE: 0,
  RESIGNED: 1,
  ON_LEAVE: 2,
} as const;

export const EMPLOYEE_STATUS_LABEL: Record<EmployeeStatus, string> = {
  [EMPLOYEE_STATUS.ACTIVE]: '在职',
  [EMPLOYEE_STATUS.RESIGNED]: '离职',
  [EMPLOYEE_STATUS.ON_LEAVE]: '休假',
} as const;

export function getEmployeeStatusLabel(status: EmployeeStatus): string {
  return EMPLOYEE_STATUS_LABEL[status];
}
```

**规则：**
- 状态类型用 `type` 别名（`type XxxStatus = 0 | 1 | 2`），**禁止用 enum**（web 侧 `erasableSyntaxOnly: true` 禁止 enum）
- 常量对象用 `as const` 确保类型精确
- 标签映射用 `Record<XxxStatus, string>` + `as const`
- 提供 `getXxxStatusLabel()` 工具函数，方便前端展示
- 注释头标明每个数字对应的业务含义

### 在 `status/index.ts` 的 barrel 中导出

```typescript
export { EMPLOYEE_STATUS, EMPLOYEE_STATUS_LABEL, getEmployeeStatusLabel } from './employee.js';
export type { EmployeeStatus } from './employee.js';
```

### 在 `src/index.ts` 的 barrel 中导出

```typescript
// ---- status layer ----
export { EMPLOYEE_STATUS, EMPLOYEE_STATUS_LABEL, getEmployeeStatusLabel } from './status/index.js';
export type { EmployeeStatus } from './status/index.js';

// ---- types layer ----
export type {
  Employee, CreateEmployeeInput, CreateEmployeeResponse, EmployeeQuery,
} from './types/index.js';
```

---

## 三、ErrorCode 层 — 业务错误码 (apps/api)

### 错误码范围

| 范围 | 模块 |
|---|---|
| 1000-1099 | 系统级通用错误 |
| 1100-1199 | 认证模块 |
| 1200-1299 | 用户管理 |
| 1300-1399 | 门店管理 |
| 1400-1499 | 地区服务 |
| 1500-1599 | 系统初始化 |
| 1600-1699 | 系统配置 |
| 1700-1799 | **预留：员工管理** |

新增模块取下一个可用范围，避免重复。

### 核心类型定义 (errorcode/index.ts)

```typescript
export interface BizError {
  /** 业务错误码 */
  code: number;
  /** 用户可见的错误消息 */
  message: string;
  /** 对应的 HTTP 状态码 */
  httpStatus: number;
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
// apps/api/src/errorcode/employee.ts

import type { BizError } from './index.js';

/**
 * 员工管理错误码 (1700-1799)
 */
export const employeeErrors = {
  MISSING_FIELDS: {
    code: 1700,
    message: '请填写所有必填字段',
    httpStatus: 400,
  } satisfies BizError,

  EMPLOYEE_NOT_FOUND: {
    code: 1701,
    message: '员工不存在',
    httpStatus: 404,
  } satisfies BizError,

  PHONE_EXISTS: {
    code: 1702,
    message: '手机号已被使用',
    httpStatus: 400,
  } satisfies BizError,

  LIST_FAILED: {
    code: 1703,
    message: '获取员工列表失败',
    httpStatus: 500,
  } satisfies BizError,

  CREATE_FAILED: {
    code: 1704,
    message: '创建员工失败',
    httpStatus: 500,
  } satisfies BizError,

  UPDATE_FAILED: {
    code: 1705,
    message: '更新员工失败',
    httpStatus: 500,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
```

**命名约定：**
- 常量名 `xxxErrors`（小驼峰）
- 错误 key 使用全大写 `SCREAMING_SNAKE_CASE`
- 每个文件 `satisfies BizError` + 整体 `as const satisfies Record<string, BizError>`

### 在 errorcode/index.ts 中注册

```typescript
export { employeeErrors } from './employee.js';
```

---

## 四、路由 Handler — 编码规范

### 完整路由模板

```typescript
import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { employeesTable } from '../db/schema.js';
import { AppError } from '../errorcode/index.js';
import { employeeErrors } from '../errorcode/employee.js';
import type {
  ApiResponse,
  PaginatedData,
  Employee,
  EmployeeQuery,
  CreateEmployeeInput,
  CreateEmployeeResponse,
} from '@dextea/shared-types';

export async function employeeRoutes(app: FastifyInstance) {
  /**
   * 员工列表
   * url：/api/v1/employees
   */
  app.get<{
    Querystring: EmployeeQuery;
    Reply: ApiResponse<PaginatedData<Employee>>;
  }>('/employees', async (request, reply) => {
    try {
      const db = await getDb();
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;

      const items = await db
        .select({ /* 按需选择字段 */ })
        .from(employeesTable)
        .limit(pageSize)
        .offset(offset)
        .orderBy(employeesTable.id);

      // ... 业务逻辑

      return {
        code: 0,
        data: { items, total, page, pageSize },
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(employeeErrors.LIST_FAILED);
    }
  });

  /**
   * 新增员工
   * url：/api/v1/employees
   */
  app.post<{
    Body: CreateEmployeeInput;
    Reply: ApiResponse<CreateEmployeeResponse>;
  }>('/employees', async (request, reply) => {
    try {
      const db = await getDb();
      const { name, phone } = request.body;

      // 1. 参数校验（快速失败）
      if (!name || !phone) {
        throw new AppError(employeeErrors.MISSING_FIELDS);
      }

      // 2. 业务约束校验
      const existing = await db
        .select()
        .from(employeesTable)
        .where(eq(employeesTable.phone, phone))
        .limit(1);

      if (existing.length > 0) {
        throw new AppError(employeeErrors.PHONE_EXISTS);
      }

      // 3. 执行写入
      const result = await db.insert(employeesTable).values({ name, phone });
      const insertId = Number(result[0]?.insertId ?? 0);

      return {
        code: 0,
        data: { id: insertId },
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(employeeErrors.CREATE_FAILED);
    }
  });
}
```

### 路由规范要点

1. **方法选择**
   - `GET` — 列表/详情查询（无副作用）
   - `POST` — 创建资源
   - `PUT` — 全量更新资源
   - `PATCH` — 部分更新（如状态变更）

2. **泛型参数**：始终显式标注 `Body`、`Querystring`、`Params`、`Reply` 泛型，确保类型检查

3. **分页参数**：始终使用 `Math.max(1, ...)` / `Math.min(100, Math.max(1, ...))` 做防御性校验，pageSize 上限 100

4. **错误处理 — try/catch 模式** （核心）：
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

5. **成功响应格式**：
   ```typescript
   { code: 0, data: ..., message: 'ok' }
   ```
   - `code: 0` 固定
   - `data` 字段精确对应 `Reply` 泛型
   - `message` 见文知意（中文消息）

6. **Schema 校验**：简单校验（必填字段、存在性）在 handler 内用 `if (!field) throw AppError` 快速失败；复杂校验使用 Zod 等 schema 工具（如需），但当前项目暂无统一 schema 方案

---

## 五、Global Error Handler（已配置，不改动）

位于 `apps/api/src/app.ts`，自动捕获所有路由中抛出的 `AppError`，无需在每个路由中手动处理 `reply.send()`：

```typescript
app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    request.log.warn({ code: error.code, err: error.message }, 'AppError');
    return reply.status(error.httpStatus).send(error.toResponse());
  }
  // ...fallback to 500
});
```

**开发者无需在每个路由中手动 try/catch 来 send 响应**，只需 `throw new AppError(...)` 即可。

---

## 六、Checklist — 新增模块自检

- [ ] 1. **Status 层** — `packages/shared-types/src/status/xxx.ts` 定义 type + 常量 + 标签
- [ ] 2. **Types 层** — `packages/shared-types/src/types/xxx.ts` 定义请求/响应接口
- [ ] 3. **Barrel 导出** — 在 `status/index.ts`、`types/index.ts`、`src/index.ts` 分别导出
- [ ] 4. **ErrorCode 层** — `apps/api/src/errorcode/xxx.ts` 定义模块错误码，在 `index.ts` 导出
- [ ] 5. **DB Schema** — `apps/api/src/db/schema.ts` 定义表结构
- [ ] 6. **路由实现** — `apps/api/src/routes/xxx.ts` 实现 CRUD 接口
- [ ] 7. **全局注册** — 在 `routes/index.ts` 注册新路由
- [ ] 8. **类型检查** — `pnpm typecheck` 通过

---

## 七、文件全景图（新增模块需修改的文件）

```
packages/shared-types/src/
├── index.ts                          # + export type { ... }
├── status/
│   ├── index.ts                      # + export/export type
│   └── xxx.ts 🔺                     # 新建：status type + 常量 + 标签
└── types/
    ├── index.ts                      # + export type { ... }
    └── xxx.ts 🔺                     # 新建：请求/响应接口

apps/api/src/
├── errorcode/
│   ├── index.ts                      # + export { xxxErrors }
│   └── xxx.ts 🔺                     # 新建：错误码定义
├── db/
│   └── schema.ts                     # + 表定义（可能已有）
└── routes/
    ├── index.ts                      # + registerRoutes 调用
    └── xxx.ts 🔺                     # 新建：路由 handler
```
