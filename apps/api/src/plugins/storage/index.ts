import { S3StorageAdapter } from './s3.adapter.js';
import { getStorageProvider } from '@dextea-admin/contracts';
import { config } from '@/config';
import type { StorageAdapter, StorageConfig } from './storage.interface.js';

/**
 * 依据给定的存储配置构造适配器（无缓存）。
 *
 * 存储厂商注册表中的 `provider` 用于确定接入协议；当前各厂商均为 S3 协议，
 * 故统一走 S3StorageAdapter。S3 连接配置来自全局 .env（见 getGlobalStorageConfig），
 * 不再依赖数据库 storage_locations 表。
 */
export function createStorageAdapter(cfg: StorageConfig): StorageAdapter {
  const def = getStorageProvider(cfg.provider);
  if (!def) {
    throw new Error(`不支持的存储厂商: ${cfg.provider}`);
  }
  switch (def.protocol) {
    case 's3':
      return new S3StorageAdapter(cfg);
    default:
      throw new Error(`暂不支持的存储协议: ${def.protocol}`);
  }
}

/**
 * 读取全局唯一的 S3 连接配置（来自 .env）。
 * 全应用共享同一份配置，所有上传/删除均使用它。
 */
export function getGlobalStorageConfig(): StorageConfig {
  const s3 = config.s3;
  return {
    provider: s3.provider,
    region: s3.region,
    endpoint: s3.endpoint,
    bucket: s3.bucket,
    accessKeyId: s3.accessKeyId,
    secretAccessKey: s3.secretAccessKey,
    forcePathStyle: s3.forcePathStyle,
    publicBaseUrl: s3.publicBaseUrl,
  };
}

export type { StorageAdapter, StorageConfig } from './storage.interface.js';
