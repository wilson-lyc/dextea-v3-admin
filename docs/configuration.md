# 运行配置指南

本文档说明 DexTea Admin 的全部环境变量与依赖服务配置。配置分为**后端（`apps/api/.env`）**与**前端（`apps/web/.env`）**两部分。

> 所有配置均提供默认值（见各 `*.example` 文件），本地开发未填写的可选项会回退到默认值，不影响核心功能启动。

## 1. 后端配置（`apps/api/.env`）

后端配置由 `apps/api/src/config.ts` 读取（基于 `dotenv`），下表列出全部变量：

### 1.1 服务基础

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3001` | 后端监听端口 |
| `HOST` | `0.0.0.0` | 监听地址 |
| `CORS_ORIGIN` | `http://localhost:5173` | 允许跨域的前端来源（多个可用逗号分隔，由 `@fastify/cors` 处理） |
| `NODE_ENV` | `development` | 运行环境；`development` 下日志使用 `pino-pretty` 彩色输出 |
| `LOG_LEVEL` | `info` | 日志级别 |

### 1.2 MySQL 数据库

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DB_TYPE` | `mysql` | 数据库方言（当前固定为 `mysql`） |
| `DB_HOST` | `localhost` | 数据库主机 |
| `DB_PORT` | `3306` | 数据库端口 |
| `DB_USER` | `root` | 用户名 |
| `DB_PASSWORD` | 空 | 密码 |
| `DB_NAME` | `dextea_admin` | 数据库名 |

> Drizzle 连接串拼接逻辑见 `apps/api/drizzle.config.ts`。表结构定义见 `apps/api/src/plugins/db/mysql/schema.ts`。

### 1.3 Redis

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `REDIS_HOST` | `localhost` | Redis 主机 |
| `REDIS_PORT` | `6379` | Redis 端口 |
| `REDIS_PASSWORD` | 空 | 密码（无密码可留空） |
| `REDIS_DB` | `0` | 数据库编号 |

> Redis 用于：登录 Token 会话（滑动过期）、缓存、分布式锁（`plugins/lock`）。

### 1.4 邮件（Nodemailer，可选）

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `MAIL_HOST` | 空 | SMTP 主机 |
| `MAIL_PORT` | `587` | SMTP 端口 |
| `MAIL_SECURE` | `false` | 是否使用 TLS（`true` 时通常用于 465） |
| `MAIL_USER` | 空 | 发件账号 |
| `MAIL_PASS` | 空 | 授权码 / 密码 |
| `MAIL_FROM` | 空 | 发件人地址 |

### 1.5 高德地图（可选）

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `AMAP_KEY` | 空 | Web 服务 API Key（地理编码用） |
| `AMAP_JS_KEY` | 空 | JavaScript API Key（前端地图组件用） |
| `AMAP_JS_SECURITY_CODE` | 空 | JS API 安全密钥 |

> 仅在门店地址地理编码、前端地图选点时用到。

### 1.6 对象存储 S3（可选，全局唯一）

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `S3_REGION` | 空 | 区域，如 `ap-guangzhou` |
| `S3_ENDPOINT` | 空 | 自定义端点（S3 兼容服务地址，如 COS / MinIO），**必须显式填写** |
| `S3_BUCKET` | 空 | 存储桶名称 |
| `S3_ACCESS_KEY_ID` | 空 | 访问密钥 ID（SecretId） |
| `S3_SECRET_ACCESS_KEY` | 空 | 私密访问密钥（SecretKey） |
| `S3_FORCE_PATH_STYLE` | `false` | 是否强制 path-style（区分 virtual-hosted 与 path-style） |
| `S3_PUBLIC_BASE_URL` | 空 | 存储桶公网基础地址，用于直链访问 |

> 图库（Gallery）、商品图片等文件上传依赖该配置，基于 AWS S3 SDK，兼容腾讯云 COS、MinIO 等。

### 1.7 Nacos（可选，配置中心）

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NACOS_SERVER_ADDR` | 空 | Nacos 服务地址 |
| `NACOS_DATA_ID` | `dextea-admin` | Data ID |
| `NACOS_GROUP` | `DEFAULT_GROUP` | Group |
| `NACOS_NAMESPACE` | 空 | 命名空间 |
| `NACOS_USERNAME` | 空 | 用户名 |
| `NACOS_PASSWORD` | 空 | 密码 |

## 2. 前端配置（`apps/web/.env`）

前端按**业务模块**拆分独立的 API Base URL（由 `apps/web/src/api/client.ts` 读取）。每个变量格式为 `VITE_API_<MODULE>_BASE_URL`：

| 变量 | 默认值 / 示例 | 说明 |
| --- | --- | --- |
| `VITE_API_AUTH_BASE_URL` | `http://localhost:3001/api/v2` | 认证模块 |
| `VITE_API_STORE_BASE_URL` | `http://localhost:3001/api/v2` | 门店模块 |
| `VITE_API_EMPLOYEE_BASE_URL` | `http://localhost:3001/api/v2` | 员工模块 |
| `VITE_API_PRODUCT_BASE_URL` | `http://localhost:3001/api/v2` | 商品模块 |
| `VITE_API_TAG_BASE_URL` | `http://localhost:3001/api/v2` | 标签模块 |
| `VITE_API_AREA_BASE_URL` | `http://localhost:3001/api/v2` | 行政区划模块 |
| `VITE_API_CONFIG_BASE_URL` | `http://localhost:3001/api/v2` | 系统配置模块 |
| `VITE_API_CUSTOMIZATION_BASE_URL` | `http://localhost:3001/api/v2` | 客制化模块 |
| `VITE_API_INGREDIENT_BASE_URL` | `http://localhost:3001/api/v2` | 原料模块 |
| `VITE_API_DASHBOARD_BASE_URL` | `http://localhost:3001/api/v2` | 仪表盘模块 |
| `VITE_API_MENU_BASE_URL` | `http://localhost:3001/api/v2` | 菜单模块 |
| `VITE_API_INIT_BASE_URL` | `http://localhost:3001/api/v2` | 初始化模块 |
| `VITE_API_ROLE_BASE_URL` | `http://localhost:3001/api/v2` | 角色模块 |
| `VITE_API_PERMISSION_BASE_URL` | `http://localhost:3001/api/v2` | 权限模块 |
| `VITE_API_GALLERY_BASE_URL` | `http://localhost:3001/api/v2` | 图库模块 |
| `VITE_API_CUSTOMER_BASE_URL` | `http://localhost:3001/api/v2` | 顾客模块 |
| `VITE_API_HEALTH_BASE_URL` | `http://localhost:3001` | 健康检查（**无** `/api/v2` 前缀） |

> 机制：客户端优先取 `VITE_API_<MODULE>_BASE_URL`；缺失时 `health` 回退到 `http://localhost:3001`，其余回退到 `http://localhost:3001/api/v2`（`client.ts` 中的 `FALLBACK_BASE_URL`）。因此**单后端部署时，大部分变量可保持默认**。

## 3. 配置示例（最小可用）

```bash
# apps/api/.env —— 仅填写数据库与 Redis，其余保持默认
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dextea
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:5173
```

```bash
# apps/web/.env —— 全部回退默认地址即可
VITE_API_HEALTH_BASE_URL=http://localhost:3001
```

## 4. 启用可选功能的注意事项

- **文件上传 / 图库**：必须正确填写 `S3_*` 系列变量，否则上传接口会失败。
- **邮件通知**：填写 `MAIL_*` 后，相关通知功能方可使用。
- **地图选点**：后端 `AMAP_KEY` 用于地理编码，前端 `AMAP_JS_KEY` / `AMAP_JS_SECURITY_CODE` 用于地图组件。

## 5. 常见问题

- **安装失败（原生编译）**：`argon2` / `esbuild` 需要本地编译，`pnpm-workspace.yaml` 已 `allowBuilds` 放行；若仍失败，请确认系统已安装编译工具链（如 Linux 的 `build-essential`）。
- **CORS 报错**：确认 `CORS_ORIGIN` 包含前端实际访问地址（含协议与端口）。
- **Token 失效 / 无法登录**：确认 Redis 可连接，且会话写入正常（认证钩子从 Redis 读取会话）。
- **数据库连不上**：确认 `DB_*` 正确，且已手动 `pnpm --filter api db:push` 同步表结构。

---

返回 [文档索引](./README.md)。
