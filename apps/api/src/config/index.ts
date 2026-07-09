import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// 从 api 应用根目录加载 .env 环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

// 全局配置 — 优先读取环境变量，提供合理的默认值
export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  host: process.env.HOST ?? '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isDev: (process.env.NODE_ENV ?? 'development') === 'development',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  apiPrefix: '/api/v1', // API 路由统一前缀

  // 数据库配置
  db: {
    type: process.env.DB_TYPE ?? 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'dextea_admin',
    url: process.env.DATABASE_URL ?? '',
  },

  // Redis 缓存配置
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? '',
    db: parseInt(process.env.REDIS_DB ?? '0', 10),
  },

  // 邮件服务配置（SMTP）
  mail: {
    host: process.env.MAIL_HOST ?? '',
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER ?? '',
    pass: process.env.MAIL_PASS ?? '',
    from: process.env.MAIL_FROM ?? '',
  },

  // 高德地图 API 密钥（服务端地理编码）
  amapKey: process.env.AMAP_KEY ?? '',
  // 高德地图 JS API 配置（前端地图展示）
  amapJsKey: process.env.AMAP_JS_KEY ?? '',
  amapJsSecurityCode: process.env.AMAP_JS_SECURITY_CODE ?? '',
} as const;
