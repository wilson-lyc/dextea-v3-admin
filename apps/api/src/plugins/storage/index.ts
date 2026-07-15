import { config } from '@/config';
import { S3StorageAdapter } from './s3.adapter.js';
import type { StorageAdapter, StorageConfig } from './storage.interface.js';

let cachedAdapter: StorageAdapter | null = null;

/**
 * 获取对象存储适配器单例。
 * 当前仅支持 S3 协议兼容的云存储（AWS / 阿里云 OSS / 腾讯云 COS / MinIO / 自建等）。
 */
export function getStorageAdapter(): StorageAdapter {
  if (cachedAdapter) return cachedAdapter;

  const s = config.storage;
  const storageConfig: StorageConfig = {
    provider: s.provider,
    region: s.region,
    endpoint: s.endpoint,
    bucket: s.bucket,
    accessKey: s.accessKey,
    secretKey: s.secretKey,
    forcePathStyle: s.forcePathStyle,
    publicBaseUrl: s.publicBaseUrl,
  };

  cachedAdapter = new S3StorageAdapter(storageConfig);

  return cachedAdapter;
}

export type { StorageAdapter, StorageConfig } from './storage.interface.js';
