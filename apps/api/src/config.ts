import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolvePath(__dirname, '../.env') });

function buildConfig() {
  const env = process.env;

  return {
    port: Number(env.PORT) || 3001,
    host: env.HOST || '0.0.0.0',
    corsOrigin: env.CORS_ORIGIN || 'http://localhost:5173',
    nodeEnv: env.NODE_ENV || 'development',
    logLevel: env.LOG_LEVEL || 'info',

    db: {
      type: env.DB_TYPE || 'mysql',
      host: env.DB_HOST || 'localhost',
      port: Number(env.DB_PORT) || 3306,
      user: env.DB_USER || 'root',
      password: env.DB_PASSWORD || '',
      name: env.DB_NAME || 'dextea_admin',
    },

    redis: {
      host: env.REDIS_HOST || 'localhost',
      port: Number(env.REDIS_PORT) || 6379,
      password: env.REDIS_PASSWORD || '',
      db: Number(env.REDIS_DB) || 0,
    },

    mail: {
      host: env.MAIL_HOST || '',
      port: Number(env.MAIL_PORT) || 587,
      secure: env.MAIL_SECURE === 'true',
      user: env.MAIL_USER || '',
      pass: env.MAIL_PASS || '',
      from: env.MAIL_FROM || '',
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

export const config = buildConfig();
