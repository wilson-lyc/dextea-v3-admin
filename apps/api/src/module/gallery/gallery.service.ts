import path from 'node:path';
import { nanoid } from 'nanoid';
import { BizError } from '@/common/exceptions/index.js';
import { createStorageAdapter, getStorageAdapter } from '@/plugins/storage/index.js';
import type { StorageAdapter } from '@/plugins/storage/index.js';
import { GalleryErrorCodes } from './gallery.errorcode.js';
import { galleryRepository } from './gallery.repository.js';
import type { GetGalleryImageListRequest } from '@dextea-admin/contracts';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp',
  'image/avif': '.avif',
};

export const galleryService = {
  async uploadImage(input: { buffer: Buffer; filename: string; mimetype: string }) {
    const { buffer, filename, mimetype } = input;

    if (!mimetype.startsWith('image/')) {
      throw new BizError(GalleryErrorCodes.INVALID_FILE);
    }

    const ext = (MIME_TO_EXT[mimetype] ?? path.extname(filename).toLowerCase()) || '.bin';
    const key = `gallery_${Date.now()}_${nanoid(8)}${ext}`;

    let result;
    try {
      result = await getStorageAdapter().upload({ key, body: buffer, contentType: mimetype });
    } catch (err) {
      throw new BizError(
        GalleryErrorCodes.UPLOAD_FAILED,
        err instanceof Error ? err.message : undefined,
      );
    }

    const id = await galleryRepository.createGalleryImage({
      url: result.url,
      objectKey: result.objectKey,
      storageLocationId: null,
    });

    return {
      id,
      url: result.url,
      storageLocationId: null,
      createdAt: new Date().toISOString(),
    };
  },

  async getGalleryImageList(params: GetGalleryImageListRequest) {
    return galleryRepository.getGalleryImageList(params.page, params.pageSize);
  },

  async deleteGalleryImage(id: number) {
    const record = await galleryRepository.getGalleryImageById(id);
    if (!record) {
      throw new BizError(GalleryErrorCodes.NOT_FOUND);
    }

    // 统一按所属存储位置（数据库配置）构造适配器；旧图无 storageLocationId 时退回全局兜底
    let adapter: StorageAdapter = getStorageAdapter();
    if (record.storageLocationId != null) {
      const location = await galleryRepository.getStorageLocationById(record.storageLocationId);
      if (location) {
        adapter = createStorageAdapter({
          provider: location.provider,
          region: location.region,
          endpoint: location.endpoint,
          bucket: location.bucket,
          accessKey: location.accessKey,
          secretKey: location.secretKey,
          forcePathStyle: location.forcePathStyle === 1,
          publicBaseUrl: location.publicBaseUrl,
        });
      }
    }

    // 对象存储删除失败不阻断数据库记录删除，避免产生悬挂引用
    try {
      await adapter.delete(record.objectKey);
    } catch (err) {
      console.error('[gallery] 删除对象存储文件失败', err);
    }

    await galleryRepository.deleteGalleryImageById(id);

    return { id };
  },
};
