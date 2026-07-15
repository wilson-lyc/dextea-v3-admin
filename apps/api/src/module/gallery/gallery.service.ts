import path from 'node:path';
import { nanoid } from 'nanoid';
import { BizError } from '@/common/exceptions/index.js';
import { createStorageAdapter } from '@/plugins/storage/index.js';
import type { StorageAdapter } from '@/plugins/storage/index.js';
import { decryptSecret } from '@/utils/crypto.js';
import { GalleryErrorCodes } from './gallery.errorcode.js';
import { galleryRepository } from './gallery.repository.js';
import type { GetGalleryImageListRequest } from '@dextea-admin/contracts';

type StorageLocationRow = NonNullable<
  Awaited<ReturnType<typeof galleryRepository.getStorageLocationById>>
>;

/**
 * 从数据库解析 S3 适配器：
 * - 指定 storageLocationId → 校验存在且启用；
 * - 未指定 → 取首个启用的默认存储位置；
 * 不再依赖任何环境变量中的 S3 连接配置。
 */
async function resolveStorageLocation(
  storageLocationId?: number | null,
): Promise<{ adapter: StorageAdapter; locationId: number }> {
  let row: StorageLocationRow;

  if (storageLocationId != null) {
    const found = await galleryRepository.getStorageLocationById(storageLocationId);
    if (!found) throw new BizError(GalleryErrorCodes.STORAGE_LOCATION_NOT_FOUND);
    if (found.status !== 1) throw new BizError(GalleryErrorCodes.STORAGE_LOCATION_DISABLED);
    row = found;
  } else {
    const def = await galleryRepository.getDefaultStorageLocation();
    if (!def) throw new BizError(GalleryErrorCodes.NO_DEFAULT_STORAGE_LOCATION);
    row = def;
  }

  const adapter = createStorageAdapter({
    provider: row.provider,
    region: row.region,
    endpoint: row.endpoint,
    bucket: row.bucket,
    accessKey: row.accessKey,
    secretKey: decryptSecret(row.secretKey),
    forcePathStyle: row.forcePathStyle === 1,
    publicBaseUrl: row.publicBaseUrl,
  });

  return { adapter, locationId: row.id };
}

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
  async uploadImage(input: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
    storageLocationId?: number | null;
  }) {
    const { buffer, filename, mimetype, storageLocationId } = input;

    if (!mimetype.startsWith('image/')) {
      throw new BizError(GalleryErrorCodes.INVALID_FILE);
    }

    const ext = (MIME_TO_EXT[mimetype] ?? path.extname(filename).toLowerCase()) || '.bin';
    const key = `gallery_${Date.now()}_${nanoid(8)}${ext}`;

    // 统一从数据库解析存储位置（指定 id 校验存在且启用；未指定则取默认启用位置）
    const { adapter, locationId } = await resolveStorageLocation(storageLocationId);
    const resolvedLocationId = locationId;

    let result;
    try {
      result = await adapter.upload({ key, body: buffer, contentType: mimetype });
    } catch (err) {
      throw new BizError(
        GalleryErrorCodes.UPLOAD_FAILED,
        err instanceof Error ? err.message : undefined,
      );
    }

    const id = await galleryRepository.createGalleryImage({
      url: result.url,
      objectKey: result.objectKey,
      storageLocationId: resolvedLocationId,
    });

    return {
      id,
      url: result.url,
      storageLocationId: resolvedLocationId,
      createdAt: new Date().toISOString(),
    };
  },

  async getGalleryImageList(params: GetGalleryImageListRequest) {
    return galleryRepository.getGalleryImageList(params.page, params.pageSize, {
      keyword: params.keyword,
      storageLocationId: params.storageLocationId,
    });
  },

  async deleteGalleryImage(id: number) {
    const record = await galleryRepository.getGalleryImageById(id);
    if (!record) {
      throw new BizError(GalleryErrorCodes.NOT_FOUND);
    }

    // 统一从数据库解析存储位置（旧图无 storageLocationId 时取默认启用位置）
    const { adapter } = await resolveStorageLocation(record.storageLocationId);

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
