# dextea-admin

**Generated:** 2026-06-23
**Commit:** c19faa2
**Branch:** main

## OVERVIEW

pnpm monorepo — Fastify 5 API (MySQL/Drizzle) + Vite 8 React 19 SPA (Tailwind v4/shadcn). Admin panel for a tea shop chain.

## STRUCTURE

```
dextea-admin/
├── apps/api/              # Fastify backend (TS 5.8)
└── apps/web/              # Vite + React frontend (TS 6.0, shadcn/ui)
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| API routes | `apps/api/src/module/*/*.controller.ts` |
| DB schema | `apps/api/src/db/schema.ts` |
| Web pages | `apps/web/src/pages/{Login,Initialization,Employees}/` |
| API service layer | `apps/web/src/services/*.ts` |
| shadcn UI primitives | `apps/web/src/components/ui/*.tsx` |
| Layout components | `apps/web/src/components/layout/*.tsx` |
| Custom hooks | `apps/web/src/hooks/*.ts(x)` |
| Theme config | `apps/web/src/index.css` (`@theme inline {}`) |
| API config | `apps/api/src/config/index.ts` |

## CONVENTIONS

- **Imports in web**: Use `@/` alias → `apps/web/src/`
- **Imports in api**: Use `.js` extension in ESM imports (Node convention for TS)
- **Git commits**: Write in **Simplified Chinese** (Trae IDE rule)
- **Tailwind v4**: All theme config in CSS (`@theme inline {}`), no JS config file
- **No enums in web**: `erasableSyntaxOnly: true` disallows enums/namespaces/parameter properties
- **Auth token**: Stored in `sessionStorage` key `"token"`, auto-attached via axios interceptor
- **Pages**: PascalCase directory names (`Employees/`, `Login/`, etc.)

## ANTI-PATTERNS (THIS PROJECT)

- **`as any` / `@ts-ignore` / `@ts-expect-error`** — never suppress type errors
- **TypeScript version drift** — web runs TS 6.0, api runs TS 5.8. Do not use TS 6.0-only syntax in api
- **Test deletions** — no test suite exists yet; do not delete non-existent tests

## UNIQUE STYLES

- **Color system**: oklch color space for all theme variables, `.dark` class toggle
- **Font**: Geist Variable (`@fontsource-variable/geist`)
- **shadcn style**: `base-nova` (from `components.json`)
- **Theme**: Custom provider in `hooks/use-theme.tsx` (not next-themes, despite dependency)
- **Password hashing**: argon2 (api), initial password returned on user creation

## COMMANDS

```bash
pnpm dev              # Start all apps in parallel
pnpm dev:api          # API only (tsx watch)
pnpm dev:web          # Web only (Vite dev server)
pnpm build            # Build all packages
pnpm typecheck        # Type-check all packages
# API-only scripts (from apps/api):
pnpm --filter dextea-admin-api db:push    # Push schema to DB
pnpm --filter dextea-admin-api db:studio  # Open Drizzle Studio
```

## NOTES

- **No CI/CD** exists — no GitHub Actions, no Docker
- **No test framework** installed anywhere
- **No formatter** (prettier/biome) configured
- **Nested `pnpm-workspace.yaml`** in `apps/api/` is dead config — pnpm ignores it
- **Per-app `pnpm-lock.yaml`** files in `apps/api/` and `apps/web/` are orphaned — use root lockfile only
- **API runs on** `http://localhost:3001` with prefix `/api/v2`
- **Web dev server** defaults to `http://localhost:5173`
