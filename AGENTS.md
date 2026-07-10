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
