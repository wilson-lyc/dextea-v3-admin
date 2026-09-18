import { nanoid } from 'nanoid';
import { BizError } from '@/common/exceptions/index.js';
import { callRpc } from '@/infrastructure/rpc/client.js';
import { config } from '@/config.js';
import { GalleryErrorCodes } from './gallery.errorcode.js';
import type { GetGalleryImageListRequest, UpdateGalleryImageRequest } from '@dextea-admin/contracts';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp',
  'image/avif': '.avif',
};

function timestampOf(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'seconds' in value) {
    const seconds = Number((value as { seconds: string | number }).seconds);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000).toISOString();
  }
  return '';
}

export const galleryService = {
  async uploadImage(input: { buffer: Buffer; filename: string; mimetype: string; name: string }) {
    const { buffer, filename, mimetype, name } = input;

    

    if (!mimetype.startsWith('image/')) {
      throw new BizError(GalleryErrorCodes.INVALID_FILE);
    }

    const ext = MIME_TO_EXT[mimetype] ?? '.bin';
    const key = `gallery_${Date.now()}_${nanoid(8)}${ext}`;

    let result: Record<string, unknown>;
    try {
      result = await callRpc<Record<string, unknown>>('xos', 'upload', {
        source: config.rpc.xosStorageSource,
        objectKey: key,
        fileName: filename,
        content: buffer,
      });
    } catch (err) {
      throw new BizError(
        GalleryErrorCodes.UPLOAD_FAILED,
        err instanceof Error ? err.message : undefined,
      );
    }

    const id = Number(result.galleryId ?? 0);
    if (id > 0 && name !== String(result.name ?? '')) {
      await callRpc('xos', 'updateName', { id, name });
    }
    return { id, name, url: String(result.url ?? ''), createdAt: new Date().toISOString() };
  },

  async getGalleryImageList(params: GetGalleryImageListRequest) {
    const allItems: Array<Record<string, unknown>> = [];
    const pageSize = 100;
    const first = await callRpc<Record<string, unknown>>('xos', 'listPage', { page: 1, pageSize });
    allItems.push(...((first.list as Array<Record<string, unknown>> | undefined) ?? []));
    const total = Number(first.total ?? allItems.length);
    for (let page = 2; page <= Math.ceil(total / pageSize); page += 1) {
      const next = await callRpc<Record<string, unknown>>('xos', 'listPage', { page, pageSize });
      allItems.push(...((next.list as Array<Record<string, unknown>> | undefined) ?? []));
    }
    const keyword = params.keyword?.trim().toLowerCase();
    const filtered = keyword
      ? allItems.filter((item) => `${item.name ?? ''} ${item.url ?? ''}`.toLowerCase().includes(keyword))
      : allItems;
    const start = (params.page - 1) * params.pageSize;
    return {
      items: filtered.slice(start, start + params.pageSize).map((item) => ({
        id: Number(item.id ?? 0),
        name: String(item.name ?? ''),
        url: String(item.url ?? ''),
        createdAt: timestampOf(item.createdAt),
      })),
      total: filtered.length,
      page: params.page,
      pageSize: params.pageSize,
    };
  },

  async deleteGalleryImage(id: number) {
    try {
      await callRpc('xos', 'delete', { id });
    } catch (err) {
      throw new BizError(GalleryErrorCodes.DELETE_FAILED, err instanceof Error ? err.message : undefined);
    }

    return { id };
  },

  async updateGalleryImageName(id: number, input: UpdateGalleryImageRequest) {
    const { name } = input;
    try {
      const result = await callRpc<Record<string, unknown>>('xos', 'updateName', { id, name });
      return { id, name: String(result.name ?? name) };
    } catch (err) {
      throw new BizError(GalleryErrorCodes.NOT_FOUND, err instanceof Error ? err.message : undefined);
    }
  },
};
