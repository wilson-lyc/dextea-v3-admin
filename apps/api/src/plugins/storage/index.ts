import { config } from '@/config';
import { S3StorageAdapter } from './s3.adapter.js';
import type { StorageAdapter, StorageConfig } from './storage.interface.js';

let cachedAdapter: StorageAdapter | null = null;

/**
 * 依据给定的存储配置直接构造一个 S3 适配器（无缓存）。
 * 统一走数据库中的 storage_locations 配置时，由调用方传入对应行映射出的 StorageConfig。
 */
export function createStorageAdapter(config: StorageConfig): StorageAdapter {
  return new S3StorageAdapter(config);
}

/**
 * 获取对象存储适配器单例（全局兜底配置，对应 storageLocationId 为空的旧图）。
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
