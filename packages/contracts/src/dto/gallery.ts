import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

/** 图片资源实体 */
export const GalleryImageSchema = z.object({
  id: z.number(),
  /** 访问地址（可直接用于 <img src>） */
  url: z.string(),
  /** 原始文件名 */
  fileName: z.string(),
  /** 文件大小（字节） */
  fileSize: z.number(),
  /** 存储厂商（local / aws / aliyun / tencent / minio / generic） */
  provider: z.string(),
  /** 文件 MIME 类型 */
  contentType: z.string(),
  /** 上传时间 */
  createdAt: z.string(),
});
export type GalleryImage = z.infer<typeof GalleryImageSchema>;

/** 图片列表查询 */
export const GetGalleryImageListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
});
export type GetGalleryImageListRequest = z.infer<typeof GetGalleryImageListRequestSchema>;

export const GetGalleryImageListResponseSchema = PaginatedDataSchema(GalleryImageSchema);
export type GetGalleryImageListResponse = z.infer<typeof GetGalleryImageListResponseSchema>;

/** 单文件上传响应 */
export const UploadGalleryImageResponseSchema = z.object({
  id: z.number(),
  url: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  provider: z.string(),
  contentType: z.string(),
  createdAt: z.string(),
});
export type UploadGalleryImageResponse = z.infer<typeof UploadGalleryImageResponseSchema>;

/** 删除响应 */
export const DeleteGalleryImageResponseSchema = z.object({
  id: z.number(),
});
export type DeleteGalleryImageResponse = z.infer<typeof DeleteGalleryImageResponseSchema>;
