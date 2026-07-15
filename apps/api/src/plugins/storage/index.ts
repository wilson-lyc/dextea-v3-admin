import { S3StorageAdapter } from './s3.adapter.js';
import type { StorageAdapter, StorageConfig } from './storage.interface.js';

/**
 * 依据给定的存储配置直接构造一个 S3 适配器（无缓存）。
 * S3 连接配置均来自数据库 storage_locations 表，由调用方（storage-location / gallery 模块）传入对应行映射出的 StorageConfig。
 */
export function createStorageAdapter(config: StorageConfig): StorageAdapter {
  return new S3StorageAdapter(config);
}

export type { StorageAdapter, StorageConfig } from './storage.interface.js';
