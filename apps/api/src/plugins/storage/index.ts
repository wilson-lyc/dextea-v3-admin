import { S3StorageAdapter } from './s3.adapter.js';
import { getStorageProvider } from '@dextea-admin/contracts';
import type { StorageAdapter, StorageConfig } from './storage.interface.js';

/**
 * 依据给定的存储配置构造适配器（无缓存）。
 *
 * 存储位置模块需先经 DTO 校验 `provider` 为已注册厂商；此处再以厂商注册表中的
 * `protocol` 分派到具体适配器实现。当前各厂商均为 S3 协议，故统一走 S3StorageAdapter；
 * 后续新增非 S3 厂商时，在 switch 中增加对应分支并实现专属适配器即可，业务层无感。
 *
 * S3 连接配置均来自数据库 storage_locations 表，由调用方（storage-location / gallery 模块）
 * 传入对应行映射出的 StorageConfig。
 */
export function createStorageAdapter(config: StorageConfig): StorageAdapter {
  const def = getStorageProvider(config.provider);
  if (!def) {
    throw new Error(`不支持的存储厂商: ${config.provider}`);
  }
  switch (def.protocol) {
    case 's3':
      return new S3StorageAdapter(config);
    default:
      throw new Error(`暂不支持的存储协议: ${def.protocol}`);
  }
}

export type { StorageAdapter, StorageConfig } from './storage.interface.js';
