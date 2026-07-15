import { config } from '@/config';
import { LocalStorageAdapter } from './local.adapter.js';
import { S3StorageAdapter } from './s3.adapter.js';
import type { StorageAdapter, StorageConfig } from './storage.interface.js';

let cachedAdapter: StorageAdapter | null = null;

/**
 * 获取对象存储适配器单例。
 * 根据 config.storage.provider 选择具体实现，从而兼容本地磁盘与各类 S3 协议云存储。
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
    localDir: s.localDir,
  };

  cachedAdapter =
    s.provider === 'local' ? new LocalStorageAdapter(storageConfig) : new S3StorageAdapter(storageConfig);

  return cachedAdapter;
}

export type { StorageAdapter, StorageConfig } from './storage.interface.js';
