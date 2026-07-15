import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import type {
  StorageAdapter,
  StorageConfig,
  StorageUploadInput,
  StorageUploadResult,
} from './storage.interface.js';

/** 支持的 S3 协议云厂商预设 */
type S3ProviderPreset = {
  /** 默认 endpoint 模板，{region} 会被替换为实际 region */
  endpoint?: string;
  /** 是否强制路径风格（virtual-hosted 与 path-style 的区别） */
  forcePathStyle: boolean;
};

const PROVIDER_PRESETS: Record<string, S3ProviderPreset> = {
  // AWS S3 官方服务使用 SDK 默认 endpoint
  aws: { forcePathStyle: false },
  // 阿里云 OSS：S3 兼容 endpoint
  aliyun: { endpoint: 'https://oss-{region}.aliyuncs.com', forcePathStyle: false },
  // 腾讯云 COS：S3 兼容 endpoint
  tencent: { endpoint: 'https://cos.{region}.myqcloud.com', forcePathStyle: false },
  // MinIO 通常部署在自定义地址且需要路径风格
  minio: { endpoint: '', forcePathStyle: true },
  // 其它 S3 兼容服务（如自建 Ceph RADOS Gateway）
  generic: { endpoint: '', forcePathStyle: false },
};

/**
 * 基于 S3 协议的对象存储适配器。
 * 通过统一 S3Client 兼容 AWS / 阿里云 OSS / 腾讯云 COS / MinIO / 自建 S3 等云服务。
 */
export class S3StorageAdapter implements StorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(config: StorageConfig) {
    const preset = PROVIDER_PRESETS[config.provider] ?? PROVIDER_PRESETS.generic;

    // endpoint 优先级：显式 endpoint > 厂商预设模板（替换 region）
    const endpoint =
      config.endpoint || (preset.endpoint ? preset.endpoint.replace('{region}', config.region) : undefined);

    this.bucket = config.bucket;
    this.publicBaseUrl = config.publicBaseUrl.replace(/\/$/, '');

    this.client = new S3Client({
      region: config.region,
      endpoint,
      forcePathStyle: endpoint ? preset.forcePathStyle : false,
      credentials:
        config.accessKey && config.secretKey
          ? { accessKeyId: config.accessKey, secretAccessKey: config.secretKey }
          : undefined,
    });
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
    return { objectKey: input.key, url: this.getPublicUrl(input.key) };
  }

  async delete(objectKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
  }

  getPublicUrl(objectKey: string): string {
    // 由运维通过 STORAGE_PUBLIC_BASE_URL 指向存储桶公网域名（如 https://bucket.oss-cn-hangzhou.aliyuncs.com）
    // 前端据此直链直接访问对象存储，鉴权由存储服务商完成
    return `${this.publicBaseUrl}/${objectKey}`;
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return { ok: true, message: '连接成功' };
    } catch (err) {
      const message = err instanceof Error ? err.message : '连接失败';
      return { ok: false, message };
    }
  }
}
