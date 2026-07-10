# DexTea API 后端分层设计

> 适用范围：`apps/api`（Fastify 5 + Drizzle ORM + MySQL）
> 目的：说明后端代码的目录分层、各层职责边界，以及一次请求的完整流转过程。
> 约定：本文中所有代码示例均来自本仓库现有实现，可直接对照源码阅读。

---

## 1. 总览

后端采用**经典的分层架构**，自顶向下为：

```
HTTP 请求
  │
  ▼
[入口层]        index.ts  ── 启动进程、监听端口
  │
  ▼
[应用装配层]    app.ts  ── 创建 Fastify 实例、注册错误处理器/插件/路由
  │
  ▼
[中间件层]      middleware/auth.ts  ── preHandler 钩子，Bearer Token + Redis 会话校验
  │
  ▼
[路由层]        routes/*.ts  ── 解析参数、Schema 校验、调用 Service、包装统一响应
  │
  ▼
[服务层]        services/*.service.ts  ── 业务逻辑、DB 读写、业务校验、编排
  │
  ▼
[数据层]        db/index.ts + db/schema.ts  ── 连接池、Drizzle 实例、表定义
```

横切关注点（被各层共享，不含业务逻辑）：

- **配置层** `config/index.ts` —— 环境变量与全局配置
- **错误处理层** `errorcode/*` —— `AppError` 类与各模块业务错误码
- **工具层** `utils/*` —— 校验、分页、密码、地理编码等纯函数
- **类型层** `types/*` + `module/*/*.type.ts` —— 各模块本地类型（Zod Schema + 状态枚举）

---

## 2. 目录结构与各层职责

```
apps/api/src/
├── index.ts                 # 入口层：进程启动
├── app.ts                   # 应用装配层：Fastify 实例、错误处理器、装配插件与路由
├── config/
│   └── index.ts             # 配置层：全局配置（环境变量 + 默认值）
├── plugins/
│   ├── index.ts             # 插件层：CORS / Redis / Swagger / SwaggerUI 注册
│   └── mail.ts              # 插件层：邮件（SMTP）插件
├── middleware/
│   └── auth.ts              # 中间件层：全局认证钩子（Bearer + Redis 会话）
├── routes/
│   ├── index.ts             # 路由聚合：注册所有路由 + 全局认证钩子
│   ├── products.ts          # 路由层：商品相关 HTTP 接口
│   ├── orders.ts            # 路由层：订单接口（示例）
│   └── ...                  # 其它模块路由
├── services/
│   ├── product.service.ts   # 服务层：商品业务逻辑与 DB 操作
│   ├── order.service.ts     # 服务层：订单业务逻辑（示例）
│   └── ...                  # 其它模块服务
├── db/
│   ├── index.ts             # 数据层：MySQL 连接池 + Drizzle 单例
│   └── schema.ts            # 数据层：Drizzle 表定义（所有数据库表）
├── errorcode/
│   ├── index.ts             # 错误处理层：AppError 类 + 统一导出
│   ├── system.ts            # 系统级错误码（10000-10099）
│   ├── products.ts          # 商品模块错误码（10800-10899）
│   └── ...                  # 各模块错误码
├── utils/
│   ├── validation.ts        # 工具层：参数校验（长度/价格/状态等）
│   ├── pagination.ts        # 工具层：分页参数归一化
│   ├── password.ts          # 工具层：密码哈希（argon2）
│   └── geocode.ts           # 工具层：高德地理编码封装
└── types/
    └── *.d.ts               # 类型层：第三方库类型补充
```

### 各层一句话职责

| 层 | 目录 | 负责 | 不负责 |
|----|------|------|--------|
| 入口层 | `index.ts` | 启动进程、监听端口、捕获致命错误 | 业务逻辑、路由细节 |
| 应用装配层 | `app.ts` | 创建实例、全局错误处理、装配插件与路由 | 具体接口实现 |
| 配置层 | `config/` | 读取环境变量、提供全局配置对象 | 业务判断 |
| 插件层 | `plugins/` | 注册基础设施插件（CORS/Redis/Swagger/邮件） | 业务处理 |
| 中间件层 | `middleware/` | 请求前置校验（认证、白名单） | 具体业务 |
| 路由层 | `routes/` | 参数解析、请求体校验、调用 Service、包装响应 | 业务逻辑、直接写 DB |
| 服务层 | `services/` | 业务逻辑、DB 读写、业务校验、事务编排 | 处理 HTTP、碰 `request/reply` |
| 数据层 | `db/` | 连接管理、表定义、ORM 实例 | 业务逻辑 |
| 错误处理层 | `errorcode/` | 错误码定义、`AppError`、统一错误响应 | 业务逻辑 |
| 工具层 | `utils/` | 可复用纯函数（校验/分页/加密） | 业务状态 |
| 类型层 | `types/` + `module/*/*.type.ts` | 各模块本地类型（Zod Schema） | 运行时行为 |

---

## 3. 各层详解

### 3.1 入口层 —— `src/index.ts`

最薄的启动入口，只做三件事：构建 app、监听端口、出错退出。

```ts
import { buildApp } from './app.js';
import { config } from './config/index.js';

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
main();
```

> 不在入口层放任何业务逻辑；所有装配都交给 `buildApp()`。

### 3.2 应用装配层 —— `src/app.ts`

负责 Fastify 实例的创建与全局行为：

- 设置 `setSchemaErrorFormatter`：把 JSON Schema 校验错误翻译成中文友好提示。
- 设置 `setErrorHandler`：统一错误出口——`AppError` 按自身 `code/httpStatus` 返回；校验错误映射为系统错误码；其余异常兜底为 `INTERNAL_ERROR`。
- 调用 `registerPlugins(app)` 与 `registerRoutes(app)` 完成装配。

```ts
app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.httpStatus).send(error.toResponse());
  }
  // 校验错误 / 未知异常 → 统一结构返回
});
```

### 3.3 配置层 —— `src/config/index.ts`

单一配置出口，优先读环境变量、缺省给合理默认值。数据库、Redis、邮件、高德密钥等都集中在此。其它层一律从 `config` 读取，不在各自文件里散落 `process.env`。

```ts
export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  db: { host: process.env.DB_HOST ?? 'localhost', /* ... */ },
  redis: { /* ... */ },
  mail: { /* ... */ },
} as const;
```

### 3.4 插件层 —— `src/plugins/`

通过 `registerPlugins(app)` 注册所有 Fastify 插件，属于"基础设施即插件"：

- `@fastify/cors`：跨域（读 `config.corsOrigin`）。
- `@fastify/redis`：Redis 连接，供鉴权中间件读取会话。
- `@fastify/swagger` + `@fastify/swagger-ui`：基于路由里的 `schema` 自动生成 OpenAPI 文档，访问 `/api/v2/docs`。
- `mailPlugin`：SMTP 邮件能力。

> 路由处理函数里可以通过 `request.server.redis` 等访问插件注入的能力。

### 3.5 中间件层 —— `src/middleware/auth.ts`

以 `preHandler` 钩子形式全局挂载（`routes/index.ts` 中 `app.addHook('preHandler', authHook)`），在路由处理前执行：

- 白名单路径（`/health`、`/api/v1/auth/login`、`/api/v1/init`、`/api/v1/docs`）跳过校验。
- 非白名单请求必须从 `Authorization: Bearer <token>` 取 token。
- 用 token 去 Redis 查会话（`dextea:admin:token:<token>`），命中则把员工信息挂到 `request.authEmployee`，供下游使用。
- 任何失败都返回 `AppError(authErrors.INVALID_TOKEN)`，不进入具体路由。

```ts
export async function authHook(request, reply) {
  const pathname = request.url.split('?')[0];
  if (isWhitelisted(pathname)) return;
  const token = request.headers.authorization?.slice(7);
  const sessionData = await request.server.redis.get(`${TOKEN_PREFIX}${token}`);
  if (!sessionData) return reply.status(err.httpStatus).send(err.toResponse());
  request.authEmployee = JSON.parse(sessionData);
}
```

> 顾客端（微信/支付宝小程序）未来需要一套平行的鉴权机制（基于 `openId` 而非员工会话），可在此层扩展，而不影响现有管理端逻辑。

### 3.6 路由层 —— `src/routes/*.ts`

**"薄路由"原则**：路由只做 HTTP 相关的事，不含业务逻辑。每个路由文件导出一个 `xxxRoutes(app)` 函数，在 `routes/index.ts` 里统一注册并加 `/api/v1` 前缀。

一个路由处理函数的标准结构：

1. 在 `schema` 中声明请求/响应 JSON Schema（同时用于校验与 Swagger 文档）。
2. 解析并归一化参数（分页、`parsePositiveInt` 等）。
3. 通过 `const db = await getDb()` 取得 Drizzle 实例，调用对应 Service。
4. 用统一结构返回：`{ code: 0, data, message }`。
5. 捕获异常：已是 `AppError` 直接抛出，其余包装为模块错误码后抛出（由全局错误处理器收口）。

```ts
app.get<{ Querystring: ProductQuery; Reply: ApiResponse<PaginatedData<Product>> }>(
  '/products',
  { schema: { /* ... */ } },
  async (request) => {
    const db = await getDb();
    const data = await listProducts(db, { page, pageSize, keyword, status });
    return { code: 0, data, message: 'ok' };
  },
);
```

> 关键约定：**路由不直接写 DB**，所有数据操作都委托给 Service；Service 的 `db` 由路由注入，便于关注点分离与测试。

### 3.7 服务层 —— `src/services/*.service.ts`

业务逻辑的核心所在地，也是唯一直接操作数据库的一层（除注入的 `db` 外，不依赖任何 HTTP 概念）：

- 函数签名统一为 `(db: DbClient, ...params) => Promise<...>`，`db` 由路由注入。
- 负责：参数二次校验、存在性/状态校验、多表编排（如创建商品同时写标签关系）、组装返回数据（如把标签挂到商品上）。
- 业务规则不满足时 `throw new AppError(xxxErrors.XXX)`。
- 复杂的查询、连表、聚合都在这里用 Drizzle 表达。

```ts
export async function createProduct(db: DbClient, input: CreateProductServiceInput) {
  validateMaxLength(input.name, 255, '商品名称');
  // ... 校验 + 插入主表 + 批量插入标签关系
  const result = await db.insert(productsTable).values({ /* ... */ });
  return { id: Number(result[0]?.insertId ?? 0) };
}
```

> 服务层是"无状态纯函数 + db 参数"的模式：不持有全局连接、不读 `request`、不返回 HTTP 状态码，只返回业务数据或抛出 `AppError`。

### 3.8 数据层 —— `src/db/`

- `db/index.ts`：懒加载的 MySQL 连接池（`mysql2`）+ Drizzle 实例单例。`getDb()` 第一次调用时建池，之后复用。
- `db/schema.ts`：所有数据库表的 Drizzle 定义。每张表变量命名 `xxxTable`，物理表名用 snake_case；自增主键用 `serial()`；外键字段用普通 `bigint({ unsigned: true })`（本仓库约定不建数据库级外键约束，关联通过代码层 join 实现）；时间戳统一 `timestamp('...', { mode: 'string' })`。

```ts
export const ordersTable = mysqlTable('orders', {
  id: serial().primaryKey(),
  orderNo: varchar('order_no', { length: 64 }).notNull().unique(),
  customerId: bigint('customer_id', { mode: 'number', unsigned: true }).notNull(),
  // ...
});
```

### 3.9 错误处理层 —— `src/errorcode/`

统一的错误出口，避免散落的字符串魔法值和不一致的响应：

- `AppError` 类：携带 `code`（业务码）、`httpStatus`、`message`，`toResponse()` 输出 `{ code, data: null, message }`。
- 各模块错误码文件（`products.ts`、`auth.ts` …）按段位划分（系统 10000、认证 10100、商品 10800 等），集中导出。
- 业务码 `0` 代表成功；非 0 为各类业务/系统错误。

```ts
throw new AppError(productErrors.PRODUCT_NOT_FOUND);
// 全局错误处理器会输出：{ code: 108xx, data: null, message: '商品不存在' }
```

### 3.10 工具层 —— `src/utils/`

与业务无关的纯函数，被路由/服务复用：

- `validation.ts`：`validateMaxLength` / `validatePrice` / `validateStatus` / `parsePositiveInt` 等。
- `pagination.ts`：分页参数归一化（页码、每页大小边界）。
- `password.ts`：argon2 密码哈希与校验。
- `geocode.ts`：高德地图地理编码封装。

### 3.11 类型层 —— `src/types/` + `module/*/*.type.ts`

- `src/types/*.d.ts`：对第三方库补充类型声明。
- `module/*/*.type.ts`：各业务领域在模块内就地定义的类型（由 Zod Schema 推导出的实体 / DTO 类型 + 状态枚举常量），不再依赖 `packages/shared-types` 共享包。

---

## 4. 分层依赖规则

```
index → app → (plugins, routes → services → db)
                middleware → (config, errorcode, redis)
                routes/services → (errorcode, utils, config, module types)
```

铁律：

1. **依赖单向向下**：上层可依赖下层，下层绝不反向依赖上层。
   - ✅ 路由调用服务、服务调用 DB。
   - ❌ 服务里不得 `import` 路由，不得引用 `request`/`reply`。
2. **服务层不碰 HTTP**：Service 签名是 `(db, params)`，返回纯数据；状态码、响应包装由路由/错误处理器负责。
3. **路由不写 DB**：路由只解析参数 + 调 Service + 包响应，不含 SQL/Drizzle 查询。
4. **横切层无业务**：`config` / `errorcode` / `utils` / `types` 不依赖任何具体业务模块，可被任意层引用。
5. **DB 注入而非自取**：Service 不自己 `getDb()`，由路由注入 `db` 参数，保证无状态、可测试。
6. **类型就地定义**：各模块类型集中在 `module/<domain>/*.type.ts`（Zod Schema + 状态枚举），不再使用跨端共享的 `shared-types` 包。

---

## 5. 关键编码约定速查

| 主题 | 约定 |
|------|------|
| 模块导入 | ESM 用 `.js` 扩展名（Node 规范，如 `import { x } from './db/index.js'`） |
| 响应结构 | 统一 `{ code: number, data: T \| null, message: string }`，`code: 0` 为成功 |
| 错误抛出 | 业务异常 `throw new AppError(xxxErrors.XXX)`，由全局处理器收口 |
| 表命名 | 变量 `xxxTable`，物理名 snake_case；主键 `serial()`；外键普通 `bigint unsigned` |
| 时间戳 | `timestamp('created_at', { mode: 'string' })`，`defaultNow()` / `onUpdateNow()` |
| 分页 | 入参字符串 `page`/`pageSize`，归一化：页码 ≥1，每页 1–100；返回 `PaginatedData` |
| 路由注册 | `module/*/*.module.ts` 各自 `app.register(xxxRoutes, { prefix: '/api/v2' })`；旧版 `routes/index.ts` 固定 `/api/v1`（已弃用） |
| 鉴权 | 全局 `preHandler` 钩子，Bearer Token → Redis 会话；白名单豁免 |
| 代码风格 | 禁用 `as any` / `@ts-ignore` / `@ts-expect-error`（见项目 AGENTS.md） |

---

## 6. 一次请求的完整生命周期（以"创建商品"为例）

1. **入口/装配**：`index.ts` → `buildApp()` 创建 Fastify 实例，注册插件与路由，监听端口。
2. **中间件**：请求进入，全局 `authHook` 校验 Bearer Token（白名单路径除外），命中则在 `request.authEmployee` 挂载员工信息。
3. **路由**：`POST /api/v1/products` 命中 `products.ts` 处理函数；Fastify 先用 `schema` 校验请求体；路由 `getDb()` 取得 `db`，调用 `createProduct(db, input)`。
4. **服务**：`product.service.ts` 执行长度/价格校验 → 插入 `products` 主表 → 批量插入标签关系 → 返回 `{ id }`；任意校验失败则 `throw AppError`。
5. **响应**：路由把结果包成 `{ code: 0, data: { id }, message: '创建成功' }` 返回。
6. **异常路径**：若服务抛 `AppError`，由 `app.ts` 的 `setErrorHandler` 拦截，按 `code`/`httpStatus` 输出 `{ code, data: null, message }`；若抛非预期异常，兜底为 `INTERNAL_ERROR`。

---

## 7. 扩展新模块时的标准动作

以"订单模块"为例，需要：

1. `db/schema.ts`：新增 `ordersTable` / `orderItemsTable` 表定义。
2. `services/order.service.ts`：实现 `createOrder(db, ...)`、`listOrders(db, ...)` 等业务函数（DB 操作 + 校验 + 编排）。
3. `routes/orders.ts`：实现 `orderRoutes(app)`，声明 `schema`、解析参数、调 Service、包响应；未知异常转 `orderErrors`。
4. `errorcode/orders.ts`：定义订单模块错误码（建议段位 `11200-11299`），并在 `errorcode/index.ts` 导出。
5. `routes/index.ts`：在 `registerRoutes` 中 `app.register(orderRoutes, { prefix: '/api/v1' })`（已弃用的旧版路由层）。
6. `module/orders/order.type.ts`：以 Zod Schema 定义 `Order`、`CreateOrderRequest`、`OrderListResponse` 等请求 / 响应类型。
7. （可选）`utils/`、`middleware/`：复用现有校验/鉴权，无需改动。

> 遵循"路由薄、服务厚、数据在底层"的分层，新模块的改动被严格限制在这几处，互不污染。
