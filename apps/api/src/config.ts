import { readFileSync } from 'node:fs';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 单独解析 .env，不污染 process.env，以便独立判断优先级
function parseEnvFile(path: string): Record<string, string> {
  try {
    return dotenv.parse(readFileSync(path, 'utf-8'));
  } catch {
    return {};
  }
}

const envFile = parseEnvFile(resolvePath(__dirname, '../.env'));

// 解析单项配置，优先级：.env > 环境变量 > 兜底
function coerce<T>(raw: string, fallback: T): T {
  if (typeof fallback === 'number') {
    const n = Number(raw);
    return (Number.isNaN(n) ? fallback : n) as T;
  }
  if (typeof fallback === 'boolean') {
    if (raw === 'true') return true as T;
    if (raw === 'false') return false as T;
    return fallback;
  }
  return raw as T;
}

function resolveValue<T>(key: string, fallback: T): T {
  if (envFile[key] !== undefined) return coerce(envFile[key], fallback);
  if (process.env[key] !== undefined) return coerce(process.env[key] as string, fallback);
  return fallback;
}

function buildConfig() {
  return {
    port: resolveValue('PORT', 3001),
    host: resolveValue('HOST', '0.0.0.0'),
    corsOrigin: resolveValue('CORS_ORIGIN', 'http://localhost:5173'),
    nodeEnv: resolveValue('NODE_ENV', 'development'),
    isDev: resolveValue('NODE_ENV', 'development') === 'development',
    logLevel: resolveValue('LOG_LEVEL', 'info'),

    db: {
      type: resolveValue('DB_TYPE', 'mysql'),
      host: resolveValue('DB_HOST', 'localhost'),
      port: resolveValue('DB_PORT', 3306),
      user: resolveValue('DB_USER', 'root'),
      password: resolveValue('DB_PASSWORD', ''),
      name: resolveValue('DB_NAME', 'dextea_admin'),
    },

    redis: {
      host: resolveValue('REDIS_HOST', 'localhost'),
      port: resolveValue('REDIS_PORT', 6379),
      password: resolveValue('REDIS_PASSWORD', ''),
      db: resolveValue('REDIS_DB', 0),
    },

    mail: {
      host: resolveValue('MAIL_HOST', ''),
      port: resolveValue('MAIL_PORT', 587),
      secure: resolveValue('MAIL_SECURE', false),
      user: resolveValue('MAIL_USER', ''),
      pass: resolveValue('MAIL_PASS', ''),
      from: resolveValue('MAIL_FROM', ''),
    },

    amapKey: resolveValue('AMAP_KEY', ''),
    amapJsKey: resolveValue('AMAP_JS_KEY', ''),
    amapJsSecurityCode: resolveValue('AMAP_JS_SECURITY_CODE', ''),

    storage: {
      /** 存储厂商（仅支持 S3 协议对象存储）：aws / aliyun / tencent / minio / generic */
      provider: resolveValue('STORAGE_PROVIDER', 'aws'),
      region: resolveValue('STORAGE_REGION', 'us-east-1'),
      /** S3 兼容服务地址（MinIO / 自建等需要填写，主流云厂商留空即可） */
      endpoint: resolveValue('STORAGE_ENDPOINT', ''),
      bucket: resolveValue('STORAGE_BUCKET', ''),
      accessKey: resolveValue('STORAGE_ACCESS_KEY', ''),
      secretKey: resolveValue('STORAGE_SECRET_KEY', ''),
      /** 强制路径风格（MinIO 等通常需要 true） */
      forcePathStyle: resolveValue('STORAGE_FORCE_PATH_STYLE', false),
      /** 存储桶公网可访问的基础地址，用于拼接图片直链，例如 https://my-bucket.oss-cn-hangzhou.aliyuncs.com */
      publicBaseUrl: resolveValue('STORAGE_PUBLIC_BASE_URL', ''),
    },
  };
}

export const config = buildConfig();
