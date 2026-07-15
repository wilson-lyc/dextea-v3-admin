import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getStorageProvider } from '@dextea-admin/contracts';
import type {
  StorageAdapter,
  StorageConfig,
  StorageUploadInput,
  StorageUploadResult,
} from './storage.interface.js';

/**
 * 基于 S3 协议的对象存储适配器。
 * 当前严格仅适配腾讯云 COS（注册为 `s3` 协议）。
 * endpoint 模板与路径风格来自厂商注册表（STORAGE_PROVIDERS），
 * 由 createStorageAdapter 依据 provider 注入，实现「对每家厂商做适配」。
 */
export class S3StorageAdapter implements StorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(config: StorageConfig) {
    // 解析厂商注册表，作为 endpoint 模板与路径风格的兜底（当 .env 未显式给出时）
    const def = getStorageProvider(config.provider);

    // endpoint 优先级：显式 endpoint > 厂商注册表模板（{region} 替换为实际 region）
    const endpoint = config.endpoint
      ? config.endpoint
      : def?.endpointTemplate
        ? def.endpointTemplate.replace('{region}', config.region)
        : undefined;

    // 路径风格：优先使用 .env 显式配置，否则回退到厂商注册表默认值
    const forcePathStyle = config.forcePathStyle || def?.forcePathStyle || false;

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
