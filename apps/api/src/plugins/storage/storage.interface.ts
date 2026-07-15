import type { Readable } from 'node:stream';

/** 存储厂商配置（与 config.storage 对齐） */
export interface StorageConfig {
  provider: string;
  region: string;
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  forcePathStyle: boolean;
  publicBaseUrl: string;
  localDir: string;
}

export interface StorageUploadInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface StorageUploadResult {
  objectKey: string;
  /** 可直接用于前端访问的完整地址 */
  url: string;
}

export interface StorageObject {
  stream: Readable;
  contentType: string;
}

/**
 * 对象存储适配层统一接口。
 * 后端业务仅依赖此接口，具体实现可为本地磁盘或任意 S3 协议兼容的云存储。
 */
export interface StorageAdapter {
  /** 上传对象，返回对象键与可访问地址 */
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  /** 删除对象 */
  delete(objectKey: string): Promise<void>;
  /** 根据对象键拼出可访问地址 */
  getPublicUrl(objectKey: string): string;
  /** 读取对象内容流（用于本地回源等场景） */
  read(objectKey: string): Promise<StorageObject | null>;
}
