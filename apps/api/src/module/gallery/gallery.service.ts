import path from 'node:path';
import { nanoid } from 'nanoid';
import { BizError } from '@/common/exceptions/index.js';
import { config } from '@/config';
import { getStorageAdapter } from '@/plugins/storage/index.js';
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
      provider: config.storage.provider,
      fileName: filename,
      fileSize: buffer.length,
      contentType: mimetype,
    });

    return {
      id,
      url: result.url,
      fileName: filename,
      fileSize: buffer.length,
      provider: config.storage.provider,
      contentType: mimetype,
      createdAt: new Date().toISOString(),
    };
  },

  async getGalleryImageList(params: GetGalleryImageListRequest) {
    return galleryRepository.getGalleryImageList(params.page, params.pageSize, params.keyword);
  },

  async deleteGalleryImage(id: number) {
    const record = await galleryRepository.getGalleryImageById(id);
    if (!record) {
      throw new BizError(GalleryErrorCodes.NOT_FOUND);
    }

    // 对象存储删除失败不阻断数据库记录删除，避免产生悬挂引用
    try {
      await getStorageAdapter().delete(record.objectKey);
    } catch (err) {
      console.error('[gallery] 删除对象存储文件失败', err);
    }

    await galleryRepository.deleteGalleryImageById(id);

    return { id };
  },
};
