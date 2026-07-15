import { createReadStream, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { Readable } from 'node:stream';
import type {
  StorageAdapter,
  StorageConfig,
  StorageObject,
  StorageUploadInput,
  StorageUploadResult,
} from './storage.interface.js';

/**
 * 本地磁盘对象存储适配器（开发 / 自托管友好型）。
 * 文件统一存放在 `localDir` 下，访问地址由 API 自身通过 `/gallery/files/:key` 路由回源。
 */
export class LocalStorageAdapter implements StorageAdapter {
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;

  constructor(config: StorageConfig) {
    this.rootDir = resolve(process.cwd(), config.localDir);
    this.publicBaseUrl = config.publicBaseUrl.replace(/\/$/, '');
    mkdirSync(this.rootDir, { recursive: true });
  }

  private resolvePath(key: string): string {
    // 仅按文件名存放，避免 key 中出现路径穿越
    const safeKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    return join(this.rootDir, safeKey);
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const filePath = this.resolvePath(input.key);
    mkdirSync(dirname(filePath), { recursive: true });
    await writeFile(filePath, input.body);
    return { objectKey: input.key, url: this.getPublicUrl(input.key) };
  }

  async delete(objectKey: string): Promise<void> {
    try {
      unlinkSync(this.resolvePath(objectKey));
    } catch {
      // 文件已不存在时忽略，保证删除操作的幂等性
    }
  }

  getPublicUrl(objectKey: string): string {
    // 回源路由固定在 /api/v2 前缀下
    return `${this.publicBaseUrl}/api/v2/gallery/files/${encodeURIComponent(objectKey)}`;
  }

  read(objectKey: string): Promise<StorageObject | null> {
    const filePath = this.resolvePath(objectKey);
    if (!existsSync(filePath)) return Promise.resolve(null);
    const stream: Readable = createReadStream(filePath);
    return Promise.resolve({ stream, contentType: 'application/octet-stream' });
  }
}
