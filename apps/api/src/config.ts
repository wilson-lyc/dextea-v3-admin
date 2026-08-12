import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolvePath(__dirname, '../.env') });

interface Config {
  port: number;
  host: string;
  corsOrigin: string;
  corsCredentials: boolean;
  nodeEnv: string;
  logLevel: string;

  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };

  redis: {
    host: string;
    port: number;
    password: string;
  };

  amap: {
    key: string;
    jsKey: string;
    jsSecurityCode: string;
  };

  s3: {
    region: string;
    endpoint: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle: boolean;
    publicBaseUrl: string;
  };
}

function buildConfig(): Config {
  const env = process.env;

  return {
    port: Number(env.PORT) || 8196,
    host: env.HOST || '127.0.0.1',
    corsOrigin: env.CORS_ORIGIN || 'http://localhost:8195',
    corsCredentials: env.CORS_CREDENTIALS !== 'false',
    nodeEnv: env.NODE_ENV || 'development',
    logLevel: env.LOG_LEVEL || 'info',

    db: {
      host: env.DB_HOST || '',
      port: Number(env.DB_PORT),
      user: env.DB_USER || '',
      password: env.DB_PASSWORD || '',
      name: env.DB_NAME || '',
    },

    redis: {
      host: env.REDIS_HOST || '',
      port: Number(env.REDIS_PORT),
      password: env.REDIS_PASSWORD || '',
    },

    amap: {
      key: env.AMAP_KEY || '',
      jsKey: env.AMAP_JS_KEY || '',
      jsSecurityCode: env.AMAP_JS_SECURITY_CODE || '',
    },

    s3: {
      region: env.S3_REGION || '',
      endpoint: env.S3_ENDPOINT || '',
      bucket: env.S3_BUCKET || '',
      accessKeyId: env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: env.S3_SECRET_ACCESS_KEY || '',
      forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true',
      publicBaseUrl: env.S3_PUBLIC_BASE_URL || '',
    },
  };
}

function validateConfig(config: Config): void {
  const missing: string[] = [];

  if (!config.db.host) missing.push('DB_HOST');
  if (!config.db.port || !Number.isFinite(config.db.port) || config.db.port <= 0) missing.push('DB_PORT');
  if (!config.db.user) missing.push('DB_USER');
  if (!config.db.name) missing.push('DB_NAME');

  if (!config.redis.host) missing.push('REDIS_HOST');
  if (!config.redis.port || !Number.isFinite(config.redis.port) || config.redis.port <= 0) missing.push('REDIS_PORT');

  if (!config.amap.key) missing.push('AMAP_KEY');
  if (!config.amap.jsKey) missing.push('AMAP_JS_KEY');
  if (!config.amap.jsSecurityCode) missing.push('AMAP_JS_SECURITY_CODE');

  if (!config.s3.region) missing.push('S3_REGION');
  if (!config.s3.endpoint) missing.push('S3_ENDPOINT');
  if (!config.s3.bucket) missing.push('S3_BUCKET');
  if (!config.s3.accessKeyId) missing.push('S3_ACCESS_KEY_ID');
  if (!config.s3.secretAccessKey) missing.push('S3_SECRET_ACCESS_KEY');
  if (!config.s3.publicBaseUrl) missing.push('S3_PUBLIC_BASE_URL');

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Please provide them in your .env file before starting the server.',
    );
    process.exit(1);
  }
}

export const config = buildConfig();
validateConfig(config);
