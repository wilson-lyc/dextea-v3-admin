import { S3StorageAdapter } from './s3.adapter.js';
import { config } from '@/config';
import type { StorageAdapter, StorageConfig } from './storage.interface.js';

/**
 * 依据给定的存储配置构造适配器（无缓存）。
 *
 * S3 连接配置来自全局 .env（见 getGlobalStorageConfig），不再依赖数据库
 * storage_locations 表，也不再记录/校验存储服务商，任何 S3 兼容存储均可接入。
 */
export function createStorageAdapter(cfg: StorageConfig): StorageAdapter {
  return new S3StorageAdapter(cfg);
}

/**
 * 读取全局唯一的 S3 连接配置（来自 .env）。
 * 全应用共享同一份配置，所有上传/删除均使用它。
 */
export function getGlobalStorageConfig(): StorageConfig {
  const s3 = config.s3;
  return {
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
