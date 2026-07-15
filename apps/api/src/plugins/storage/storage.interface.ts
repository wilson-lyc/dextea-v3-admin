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
}

export interface StorageUploadInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface StorageUploadResult {
  objectKey: string;
  /** 可直接用于前端直连访问的完整地址 */
  url: string;
}

/**
 * 对象存储适配层统一接口。
 * 后端业务仅依赖此接口，具体实现为任意 S3 协议兼容的云存储。
 * 前端通过 getPublicUrl 返回的直链直接访问对象存储，鉴权由存储服务商完成。
 */
export interface StorageAdapter {
  /** 上传对象，返回对象键与可访问地址 */
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  /** 删除对象 */
  delete(objectKey: string): Promise<void>;
  /** 根据对象键拼出可直连访问的地址 */
  getPublicUrl(objectKey: string): string;
  /** 探测存储连通性，返回是否可用与提示信息 */
  testConnection(): Promise<{ ok: boolean; message: string }>;
}
