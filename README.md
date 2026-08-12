# dextea-admin

**DexTea（德贤茶）连锁管理后台** —— 面向总部/运营的 Web 管理系统，采用前后端分离 + 共享契约的 pnpm monorepo。

## 项目介绍

管理后台覆盖连锁门店运营的完整管理面：

- **门店管理**：门店信息、门店目录、营业状态、高德地图选点
- **商品与菜单**：商品、菜单、原料、客制化、标签、图库
- **组织与权限**：员工、角色、权限（RBAC）、JWT 认证
- **业务支撑**：顾客、行政区划（省市区）、仪表盘、系统配置、系统初始化
- 内建 Swagger 接口文档（`/api/v2/docs`）

## 技术栈

| 端 | 技术栈 |
| --- | --- |
| `apps/api` | Node.js + **Fastify 5** + TypeScript + Zod（`fastify-type-provider-zod`）、**Drizzle ORM**（MySQL）、Redis（ioredis）、Argon2、Nodemailer、AWS S3 SDK、高德地图服务 |
| `apps/web` | **React 19** + **Vite** + TypeScript + **Tailwind CSS v4** + shadcn/ui（@base-ui/react）+ react-router-dom 7 + axios |
| `packages/contracts` | 纯 TypeScript + Zod：跨端共享的 DTO 与枚举，前后端类型安全的单一事实来源 |

## 目录结构

```
dextea-admin/
├── apps/
│   ├── api/                  # 后端 API 服务（Fastify）
│   │   ├── .env.example      # 环境变量模板
│   │   ├── drizzle.config.ts # Drizzle 迁移配置
│   │   └── src/
│   │       ├── index.ts      # 入口（含 Swagger）
│   │       ├── config.ts     # 环境变量解析
│   │       ├── middleware/   # auth.ts / authorize.ts（JWT + RBAC）
│   │       ├── module/       # 17 个业务模块（controller/service/repository 分层）
│   │       └── plugins/      # db(mysql/redis)、geocode、lock、mail、password、storage
│   └── web/                  # 管理后台前端 SPA（React + Vite）
│       ├── .env.example      # 各业务模块独立的 VITE_API_*_BASE_URL
│       └── src/
│           ├── api/          # 每业务模块一个 API 封装
│           ├── components/   # ui（shadcn）、layout、auth、amap
│           └── pages/        # 登录、仪表盘、门店/商品/菜单/员工/角色/权限等页面
└── packages/
    └── contracts/            # 共享契约层 @dextea-admin/contracts（zod DTO + 枚举）
```

## 本地开发

要求：Node.js ≥ 18、pnpm。

```bash
pnpm install
pnpm dev          # 先构建 contracts，再并行启动 api 与 web
```

- API 服务：`pnpm dev:api`，默认端口 `3001`（`apps/api/.env` 中的 `PORT`）
- Web 前端：`pnpm dev:web`，默认 `http://localhost:5173`
- 数据库迁移（开发）：`pnpm --filter api db:push` 或 `db:generate` / `db:migrate`

首次运行前，将 `apps/api/.env.example`、`apps/web/.env.example` 复制为 `.env` 并填写配置：

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example  apps/web/.env
```

API 必需的外部依赖：MySQL（库名默认 `dextea`）、Redis、高德地图 Web 服务 Key（`AMAP_KEY`）、S3 兼容对象存储（`S3_REGION`/`S3_ENDPOINT`/`S3_*`）；Nacos 为可选配置源。

## 构建

```bash
pnpm build        # 先构建 packages/contracts，再递归构建所有包
```

构建产物：

- `apps/api/dist/` —— 后端编译产物（`node dist/index.js` 启动）
- `apps/web/dist/` —— 前端静态资源（`tsc -b && vite build` 产物）
- `packages/contracts/dist/` —— 契约层编译产物

## 部署

### 1. 后端 API（`apps/api`）

```bash
pnpm --filter api build
node apps/api/dist/index.js
```

- 生产环境通过环境变量注入配置（或在工作目录放置 `.env`），关键项：`PORT`、`DB_*`（MySQL）、`REDIS_*`、`AMAP_KEY`、`S3_*`、`CORS_ORIGIN`（前端域名）。
- 建议以 systemd / PM2 / 容器方式常驻运行，示例（systemd）：

```ini
[Unit]
Description=dextea-admin-api
After=network.target

[Service]
WorkingDirectory=/opt/dextea-admin/apps/api
EnvironmentFile=/opt/dextea-admin/apps/api/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

### 2. 前端 SPA（`apps/web`）

```bash
pnpm --filter web build
```

- 将 `apps/web/dist/` 部署到任意静态托管（nginx / CDN / OSS）。
- 构建时通过 `VITE_API_*_BASE_URL` 指向生产 API 地址，或用 nginx 反向代理同源转发到后端：

```nginx
server {
    listen 80;
    server_name admin.example.com;

    root /opt/dextea-admin/apps/web/dist;
    index index.html;
    try_files $uri $uri/ /index.html;   # SPA 路由回退

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
    }
}
```

### 3. 注意事项

- 三个子包需按依赖顺序构建：`contracts` → `api`/`web`（根 `pnpm build` 已处理）。
- 前端为 SPA，nginx 需配置 `try_files ... /index.html` 回退，否则刷新子路由会 404。
- 首次部署需访问初始化向导完成系统初始化（`init` 模块）。
