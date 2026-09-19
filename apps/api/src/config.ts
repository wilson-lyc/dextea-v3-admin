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

  nacos: {
    enabled: boolean;
    serverList: string[];
    namespace: string;
    group: string;
    username: string;
    password: string;
  };

  rpc: {
    productServiceName: string;
    productAddress: string;
    productAdminServiceToken: string;
    productBusinessServiceToken: string;
    storeServiceName: string;
    storeAddress: string;
    storeAdminServiceToken: string;
    storeBusinessServiceToken: string;
    storeCredentialServiceToken: string;
    tradeServiceName: string;
    tradeAddress: string;
    xosServiceName: string;
    xosAddress: string;
    xosStorageSource: string;
  };

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
    db: number;
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

    nacos: {
      enabled: env.NACOS_ENABLED === 'true',
      serverList: (env.NACOS_SERVER_ADDR || '').split(',').map((item) => item.trim()).filter(Boolean),
      namespace: env.NACOS_NAMESPACE || 'public',
      group: env.NACOS_GROUP || 'DEFAULT_GROUP',
      username: env.NACOS_USERNAME || '',
      password: env.NACOS_PASSWORD || '',
    },

    rpc: {
      productServiceName: env.PRODUCT_SERVICE_NAME || 'dextea-product',
      productAddress: env.PRODUCT_SERVICE_ADDR || '127.0.0.1:9090',
      productAdminServiceToken: env.PRODUCT_ADMIN_SERVICE_TOKEN || '',
      productBusinessServiceToken: env.PRODUCT_BUSINESS_SERVICE_TOKEN || '',
      storeServiceName: env.STORE_SERVICE_NAME || 'dextea-store-service',
      storeAddress: env.STORE_SERVICE_ADDR || '127.0.0.1:9092',
      storeAdminServiceToken: env.STORE_ADMIN_SERVICE_TOKEN || '',
      storeBusinessServiceToken: env.STORE_BUSINESS_SERVICE_TOKEN || '',
      storeCredentialServiceToken: env.STORE_CREDENTIAL_SERVICE_TOKEN || '',
      tradeServiceName: env.TRADE_SERVICE_NAME || 'dextea-trade',
      tradeAddress: env.TRADE_SERVICE_ADDR || '127.0.0.1:9091',
      xosServiceName: env.XOS_SERVICE_NAME || 'dextea-xos',
      xosAddress: env.XOS_SERVICE_ADDR || '127.0.0.1:9091',
      xosStorageSource: env.XOS_STORAGE_SOURCE || 'minio-dev',
    },

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
      db: Number(env.REDIS_DB) || 0,
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
  if (!Number.isInteger(config.redis.db) || config.redis.db < 0) missing.push('REDIS_DB');

  if (!config.amap.key) missing.push('AMAP_KEY');
  if (!config.amap.jsKey) missing.push('AMAP_JS_KEY');
  if (!config.amap.jsSecurityCode) missing.push('AMAP_JS_SECURITY_CODE');

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
