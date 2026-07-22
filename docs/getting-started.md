# 快速启动

本指南帮助你在本地快速把 DexTea Admin 跑起来。

## 1. 环境要求

| 工具 | 版本要求 | 说明 |
| --- | --- | --- |
| Node.js | 建议 20 LTS 及以上 | 后端 ESM、前端 Vite 8 均需要较新版本 |
| pnpm | 9 及以上 | 包管理器（monorepo 工作区） |
| MySQL | 8.0 及以上 | 主数据库（Drizzle ORM 方言为 `mysql`） |
| Redis | 6 及以上 | Token 会话 / 缓存 / 分布式锁 |

> 对象存储（S3 / COS）、邮件（SMTP）、高德地图 API 为**可选**依赖——仅在涉及文件上传、邮件通知、地理编码功能时才需要配置。

## 2. 克隆与安装

```bash
# 1. 获取代码（如已克隆可跳过）
git clone <repo-url> dextea-admin
cd dextea-admin

# 2. 安装全部 workspace 依赖
pnpm install
```

> 说明：后端用到 `argon2`、`esbuild` 等需要原生编译的依赖，`pnpm-workspace.yaml` 已通过 `allowBuilds` 放行。首次安装可能耗时较长。

## 3. 准备依赖服务

### MySQL

本地启动一个 MySQL 实例，并创建一个空数据库（名称与后面的 `DB_NAME` 一致，默认 `dextea`）：

```sql
CREATE DATABASE dextea CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> 数据库表结构由后端通过 Drizzle 自动同步，无需手动建表。首次启动前可运行：

```bash
pnpm --filter api db:push   # 将 schema.ts 同步到数据库
```

### Redis

本地启动 Redis（默认 `127.0.0.1:6379`），无需预创建数据。

## 4. 配置环境变量

复制示例文件为 `.env` 并按需修改：

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

最小可用配置（仅本地开发，其余保持默认即可）：

```bash
# apps/api/.env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密码
DB_NAME=dextea
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:5173
```

```bash
# apps/web/.env
VITE_API_AUTH_BASE_URL=http://localhost:3001/api/v2
VITE_API_HEALTH_BASE_URL=http://localhost:3001
# …其它模块默认回退到同一地址，可保持示例原值
```

完整配置项说明见 [运行配置指南](./configuration.md)。

## 5. 启动

### 方式一：同时启动前后端（推荐）

```bash
pnpm dev
```

该命令会先编译 `contracts` 共享包，再以并行方式启动 `api` 与 `web` 的开发服务。

### 方式二：分别启动

```bash
pnpm dev:api   # 仅启动后端（默认 http://localhost:3001）
pnpm dev:web   # 仅启动前端（默认 http://localhost:5173）
```

> `dev:api` 使用 `tsx watch` 热重载；`dev:web` 使用 Vite 开发服务器。

## 6. 访问与初始化

1. 打开前端：<http://localhost:5173>
2. 首次进入会跳转到 **系统初始化** 页面（`/initialization`）：
   - 该流程会创建内置的「超级管理员」角色与 `*` 超级权限（`init.presets.ts`）。
   - 按页面提示设置管理员账号后，即可登录使用。
3. 登录后进入仪表盘，开始配置门店、商品、菜单等业务数据。

> 初始化接口 `/api/v2/init` 在认证白名单中，无需先登录即可访问。

## 7. 常用脚本

根目录（`package.json`）：

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 编译 contracts 并并行启动 api + web |
| `pnpm dev:api` | 仅启动后端 |
| `pnpm dev:web` | 仅启动前端 |
| `pnpm build` | 编译 contracts 并构建全部子包 |
| `pnpm typecheck` | 编译 contracts 并执行全量类型检查 |

后端（`apps/api`）额外脚本：

| 命令 | 说明 |
| --- | --- |
| `pnpm --filter api db:push` | 将 schema 同步到数据库 |
| `pnpm --filter api db:generate` | 生成迁移文件 |
| `pnpm --filter api db:migrate` | 执行迁移 |
| `pnpm --filter api db:studio` | 打开 Drizzle Studio |

## 8. API 文档

后端启动后，Swagger UI 文档位于：

- <http://localhost:3001/api/v2/docs>

所有业务接口均挂载在 `/api/v2` 前缀下，并使用 `Bearer Token` 鉴权。

---

返回 [文档索引](./README.md)。
