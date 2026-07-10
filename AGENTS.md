# Agent instructions for dextea-admin

Admin panel for a tea shop chain. pnpm monorepo: Fastify 5 API + Vite 8 React 19 SPA.

## Commands

```bash
# Dev (both apps)
pnpm dev

# Dev single app
pnpm dev:api    # API on :3001
pnpm dev:web    # Vite on :5173

# Typecheck all
pnpm typecheck

# API only
pnpm --filter api typecheck
pnpm --filter api db:push      # push schema changes to MySQL
pnpm --filter api db:generate  # generate Drizzle migration files
pnpm --filter api db:migrate   # run migrations

# Web only
pnpm --filter web lint
pnpm --filter web build
```

No test suite exists yet.

## Backend (`apps/api`)

### Architecture

Module-based. Each module lives in `src/module/{name}/` with 6 files:

```
{name}.module.ts       # FastifyPluginAsyncZod, registers routes
{name}.controller.ts   # Route definitions with Zod schema validation
{name}.service.ts      # Business logic, calls repository
{name}.repository.ts   # Drizzle ORM queries
{name}.type.ts         # Zod v4 schemas + TS types
{name}.errorcode.ts    # Error codes for the module
```

Modules register in `src/index.ts` via `app.register(registerXxxModule)`.
The old `src/routes/` layer is deprecated — use `src/module/` for new code.

### Key patterns

- **Import extensions**: ESM requires `.js` extensions in import paths (`from './foo.js'`).
- **Zod v4**: Import as `import { z } from 'zod/v4'` — NOT from `'zod'`.
- **Path aliases**: `@/` maps to `src/` (configured in tsconfig).
- **Response wrapper**: Use `ApiResponse.success(data)` / `ApiResponse.error(code, message)` from `@/common/types`.
- **Paginated response**: Wrap entity schema with `PaginatedDataSchema(EntitySchema)`.
- **Error handling**: Throw `new BizError(ModuleErrorCodes.XXX)` — global handler catches it. No try/catch in controllers.
- **DB access**: Import `db` from `@/plugins/db/mysql/index.js`. Schema tables in `schema.ts` use `xxxTable` naming.
- **No DB-level foreign keys**: Relations enforced in code via joins.

### Error code ranges

| Range | Module |
|-------|--------|
| 10000-10099 | System |
| 10100-10199 | Auth |
| 10200-10299 | Employees |
| 10300+ | Other modules (assign next available hundred) |

### DB schema conventions

- Variable: `xxxTable`. Physical name: snake_case.
- Primary key: `serial()`. Timestamps: `timestamp('created_at', { mode: 'string' })` with `defaultNow()` / `onUpdateNow()`.
- Status fields: plain `tinyint()` — no `$type<>()` binding. Status enums defined in `*.type.ts` as const objects.
- Two-line JSDoc on every table: `/** \n * 表名\n * 描述\n */`.

### Adding a new module

1. Create `src/module/{name}/` with the 6 files above.
2. Add table(s) to `src/plugins/db/mysql/schema.ts`.
3. Add error codes in `{name}.errorcode.ts`.
4. Register in `src/index.ts`: `await app.register(registerXxxModule)`.
5. Run `pnpm --filter api typecheck` to verify.

### Shared contracts package (`packages/contracts`)

前后端共享的「契约」统一放在 `packages/contracts`（包名 `@dextea-admin/contracts`），是 DTO 与状态枚举的单一真源，避免前后端各写一份导致漂移。

- **发布形态**：该包需先 `tsc` 构建出 `dist/`（含 `.d.ts`），前后端均以 `node_modules` 依赖形式消费——API 用 `tsc` 且 `rootDir: ./src`，只有 `.d.ts`/`.js` 产物能绕过 rootDir 限制；Web 由 Vite 直接打包。
- **构建顺序**：`apps/api` 与 `apps/web` 的 `build`/`typecheck`/`dev` 脚本已通过 `pnpm -C packages/contracts build` 先构建本包（根 `pnpm typecheck`/`build` 同理）。
- **依赖声明**：`apps/api` 与 `apps/web` 的 `package.json` 均已加入 `"@dextea-admin/contracts": "workspace:*"`（pnpm 仅会软链被声明依赖的工作区包）。
- **导出子路径**：
  - `@dextea-admin/contracts` → 全部（公共响应体 `ApiResponse`/`PaginatedData`/`ApiResponseSchema`/`PaginatedDataSchema`、各模块 DTO、状态枚举）。
  - `@dextea-admin/contracts/status` → 仅状态枚举（不含 zod，供前端运行时使用而不引入 zod 包）。
  - `@dextea-admin/contracts/dto` → 仅 DTO。
- **状态枚举约定**：每个状态项统一包含三字段 `key`（稳定字符串键）、`label`（中文语义，界面展示用）、`value`（数字，存储/传输用）。例：
  ```ts
  export const EMPLOYEE_STATUS = {
    DISABLED: { key: 'disabled', label: '禁用', value: 0 },
    ACTIVE: { key: 'active', label: '激活', value: 1 },
  } as const;
  ```
- **模块 type.ts 的写法**：已迁移模块不再保留 `module/{name}/{name}.type.ts` 薄层，直接在 controller/service 中 `import ... from '@dextea-admin/contracts'`，不要在模块内重复定义 schema/类型/枚举。若某模块有大量既有相对路径引用（如 `auth` 等其它模块 `import ... from '../employees/employees.type.js'`），可临时保留一个再导出薄层过渡，待引用方改完即删除。
- **Zod 版本**：本包固定 `zod@4.4.3`，与 API 保持一致；前端以 `import type` 引入类型（编译期擦除，不会把 zod 打进浏览器包）。

## Frontend (`apps/web`)

### Stack

React 19, Vite 8, TypeScript ~6, Tailwind CSS v4, shadcn/ui, react-router-dom v7, @tanstack/react-table, lucide-react icons, sonner toasts.

### Key patterns

- **Path alias**: `@/` maps to `src/`.
- **shadcn components**: Install with `npx shadcn@latest add <component>`.
- **UI language**: Semantic Chinese text for all user-facing labels. Never display raw numeric status codes.
- **Table container**: Always `flex flex-1 flex-col overflow-auto rounded-lg border` — no max-height.
- **List pages**: Use shadcn data-table pattern (`@tanstack/react-table` + `DataTable`), not manual `<Table>`.
- **base-ui Select**: `SelectValue` does NOT auto-render label — pass as children: `<SelectValue>{label}</SelectValue>`.
- **AmapMapPicker**: `useEffect` with `[]` deps. Use `onPickRef` (ref-based callback) to avoid effect re-runs. Components in `src/components/amap/`.

### API layer

Each module has its own `src/api/{module}.ts` file with a per-module base URL from `.env` (e.g. `VITE_API_STORE_BASE_URL`). The auth interceptor lives in `src/api/index.ts` / `http.ts`.

### Auth flow

- ProtectedRoute checks sessionStorage → calls `GET /auth/me` → axios interceptor attaches Bearer.
- Response interceptor: 401 → login, 403 (code 1103) → login, 403 (other) → /403.
- Auth expiry toast is in the axios interceptor only — not duplicated in ProtectedRoute.

### Store/Employee password pattern

Create user → API returns `initialPassword` → frontend shows Dialog with password + "此密码仅显示一次" warning → user closes. Same pattern for both employees and stores.

## Environment

Copy `.env.example` to `.env` in both `apps/api/` and `apps/web/`. Required services: MySQL (port 3306), Redis (port 6379), Amap API keys (separate web-service and JS API keys).

## Skills

Project-specific skills live in `.agents/skills/`:
- `api-module-architecture` — backend module creation guide (authoritative for new modules)
- `table-specifications` — list page table rendering patterns
- `detail-page` — detail page design spec
- `shadcn` — shadcn component management

Use `/skill-name` to load them.
