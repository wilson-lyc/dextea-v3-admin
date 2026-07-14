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

// Nacos 统一配置源，预留能力，默认未启用。优先级位于环境变量之后、兜底之前
const nacosStore: { enabled: boolean; values: Record<string, string> } = {
  enabled: false,
  values: {},
};

interface NacosOptions {
  serverAddr: string;
  dataId: string;
  group: string;
  namespace?: string;
  username?: string;
  password?: string;
}

// 通过 Nacos OpenAPI 拉取配置，properties 格式与 .env 兼容
async function fetchNacosConfig(opts: NacosOptions): Promise<Record<string, string>> {
  const base = opts.serverAddr.replace(/\/+$/, '');
  const url = new URL(`${base}/nacos/v1/cs/configs`);
  url.searchParams.set('dataId', opts.dataId);
  url.searchParams.set('group', opts.group);
  if (opts.namespace) url.searchParams.set('tenant', opts.namespace);

  const headers: Record<string, string> = {};
  if (opts.username && opts.password) {
    headers.Authorization = `Basic ${Buffer.from(`${opts.username}:${opts.password}`).toString('base64')}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`[config] 从 Nacos 拉取配置失败: ${res.status} ${res.statusText}`);
  }
  const text = (await res.text()).trim();
  if (!text) return {};
  return dotenv.parse(text);
}

// 未配置 NACOS_SERVER_ADDR 时自动跳过，不改变既有逻辑
export async function initNacosConfig(): Promise<void> {
  const serverAddr = envFile.NACOS_SERVER_ADDR ?? process.env.NACOS_SERVER_ADDR;
  if (!serverAddr) return;

  const opts: NacosOptions = {
    serverAddr,
    dataId: envFile.NACOS_DATA_ID ?? process.env.NACOS_DATA_ID ?? 'dextea-admin',
    group: envFile.NACOS_GROUP ?? process.env.NACOS_GROUP ?? 'DEFAULT_GROUP',
    namespace: envFile.NACOS_NAMESPACE ?? process.env.NACOS_NAMESPACE,
    username: envFile.NACOS_USERNAME ?? process.env.NACOS_USERNAME,
    password: envFile.NACOS_PASSWORD ?? process.env.NACOS_PASSWORD,
  };

  const values = await fetchNacosConfig(opts);
  nacosStore.values = values;
  nacosStore.enabled = true;
  refreshConfig();
}

// 解析单项配置，优先级：.env > 环境变量 > nacos > 兜底
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
  if (nacosStore.enabled && nacosStore.values[key] !== undefined) {
    return coerce(nacosStore.values[key], fallback);
  }
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

// 可变导出，initNacosConfig() 后会重新解析。ESM 实时绑定使引用方自动生效
export let config = buildConfig();

function refreshConfig(): void {
  config = buildConfig();
}
