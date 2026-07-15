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

/**
 * 基于 S3 协议的对象存储适配器。
 * 适配任意 S3 兼容存储，endpoint 与路径风格完全由 .env 的 S3 配置决定，
 * 不再依赖厂商注册表或 provider 字段。
 */
export class S3StorageAdapter implements StorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(config: StorageConfig) {
    const endpoint = config.endpoint || undefined;
    const forcePathStyle = config.forcePathStyle;

    this.bucket = config.bucket;
    this.publicBaseUrl = config.publicBaseUrl.replace(/\/$/, '');

    this.client = new S3Client({
      region: config.region,
      endpoint,
      forcePathStyle,
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
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
    // publicBaseUrl 来自全局 .env 的 S3 配置（桶公网域名，如 https://bucket.cos.ap-guangzhou.myqcloud.com）
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
