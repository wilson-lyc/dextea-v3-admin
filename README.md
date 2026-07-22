# DexTea Admin

> 一个面向茶饮连锁品牌的现代化管理系统（后端 + 前端 + 共享契约）。

DexTea Admin 是用于管理茶饮连锁门店、商品、菜单、原料、员工、角色权限、顾客与图库等业务的后台系统。项目采用 **pnpm 多包（monorepo）** 结构，包含三个子包：

| 包 | 路径 | 说明 |
| --- | --- | --- |
| `@dextea-admin/contracts` | `packages/contracts` | 前后端共享的 Zod 契约（状态枚举、DTO、统一响应/分页结构） |
| `api` | `apps/api` | 基于 Fastify v5 + Drizzle ORM 的后端服务 |
| `web` | `apps/web` | 基于 React 19 + Vite 的前端管理后台 |

---

## 文档目录

详细的文档位于 [`docs/`](./docs) 目录：

- [系统架构](./docs/architecture.md) —— 整体技术栈、分层设计、模块划分与数据流
- [快速启动](./docs/getting-started.md) —— 环境要求与本地一键启动步骤
- [运行配置指南](./docs/configuration.md) —— 环境变量、数据库、Redis、对象存储等配置说明
- [文档索引](./docs/README.md) —— 文档总览

---

## 技术栈一览

**后端 (`apps/api`)**

- 运行时：Node.js（ESM）+ TypeScript
- Web 框架：[Fastify v5](https://fastify.dev/)
- 数据访问：[Drizzle ORM](https://orm.drizzle.team/)（MySQL）
- 缓存 / 会话：[ioredis](https://github.com/redis/ioredis)（基于 Redis 的 Token 会话）
- 参数校验：[Zod v4](https://zod.dev/)（`fastify-type-provider-zod`）
- 安全： [`argon2`](https://github.com/ranisalt/node-argon2) 密码哈希
- 对象存储：AWS S3 SDK（兼容 COS / MinIO 等）
- 邮件：Nodemailer
- API 文档：Swagger UI（Fastify Swagger）
- 地理编码：高德地图 Web 服务 API

**前端 (`apps/web`)**

- 框架：React 19 + TypeScript
- 构建：Vite 8
- 路由：React Router v7
- 样式：Tailwind CSS v4
- 组件库：shadcn（基于 [Base UI](https://base-ui.com/)）
- 请求：Axios（按业务模块拆分独立实例）
- 提示：Sonner

**共享契约 (`packages/contracts`)**

- 通过 Zod 定义状态枚举（`status`）、业务 DTO（`dto`）、统一响应与分页结构（`common`），被 `api` 与 `web` 同时依赖，保证前后端类型与校验规则一致。

---

## 快速预览

```bash
# 安装依赖
pnpm install

# 配置环境变量（见 docs/configuration.md）
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 启动后端 + 前端（开发模式）
pnpm dev
```

启动后：

- 前端：<http://localhost:5173>
- 后端 API：<http://localhost:3001/api/v2>
- API 文档（Swagger UI）：<http://localhost:3001/api/v2/docs>

更详细的步骤与故障排查请见 [快速启动](./docs/getting-started.md)。
