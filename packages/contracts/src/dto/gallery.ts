import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

/** 图片资源实体 */
export const GalleryImageSchema = z.object({
  id: z.number(),
  /** 访问地址（可直接用于 <img src>） */
  url: z.string(),
  /** 所属存储位置 ID（旧图/全局兜底图可为空） */
  storageLocationId: z.number().nullable(),
  /** 所属存储位置名称 */
  storageLocationName: z.string().nullable(),
  /** 上传时间 */
  createdAt: z.string(),
});
export type GalleryImage = z.infer<typeof GalleryImageSchema>;

/** 图片列表查询 */
export const GetGalleryImageListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
  /** 按存储位置筛选（可选） */
  storageLocationId: z.coerce.number().int().positive().optional(),
});
export type GetGalleryImageListRequest = z.infer<typeof GetGalleryImageListRequestSchema>;

export const GetGalleryImageListResponseSchema = PaginatedDataSchema(GalleryImageSchema);
export type GetGalleryImageListResponse = z.infer<typeof GetGalleryImageListResponseSchema>;

/** 单文件上传响应 */
export const UploadGalleryImageResponseSchema = z.object({
  id: z.number(),
  url: z.string(),
  /** 所属存储位置 ID */
  storageLocationId: z.number().nullable(),
  createdAt: z.string(),
});
export type UploadGalleryImageResponse = z.infer<typeof UploadGalleryImageResponseSchema>;

/** 删除响应 */
export const DeleteGalleryImageResponseSchema = z.object({
  id: z.number(),
});
export type DeleteGalleryImageResponse = z.infer<typeof DeleteGalleryImageResponseSchema>;
