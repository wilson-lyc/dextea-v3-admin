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

const envFile = parseEnvFile(resolvePath(__dirname, '../../.env'));

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
  };
}

export const config = buildConfig();
