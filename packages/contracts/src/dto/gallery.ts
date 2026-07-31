import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

/** 图片资源实体 */
export const GalleryImageSchema = z.object({
  id: z.number().describe('ID'),
  /** 图片名称（用于检索） */
  name: z.string().describe('名称'),
  /** 访问地址（可直接用于 <img src>） */
  url: z.string().describe('图片地址'),
  /** 上传时间 */
  createdAt: z.string().describe('创建时间'),
});
export type GalleryImage = z.infer<typeof GalleryImageSchema>;

/** 图片列表查询 */
export const GetGalleryImageListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('每页条数'),
  keyword: z.string().optional().describe('关键字'),
});
export type GetGalleryImageListRequest = z.infer<typeof GetGalleryImageListRequestSchema>;

export const GetGalleryImageListResponseSchema = PaginatedDataSchema(GalleryImageSchema);
export type GetGalleryImageListResponse = z.infer<typeof GetGalleryImageListResponseSchema>;

/** 单文件上传响应 */
export const UploadGalleryImageResponseSchema = z.object({
  id: z.number().describe('ID'),
  name: z.string().describe('名称'),
  url: z.string().describe('图片地址'),
  createdAt: z.string().describe('创建时间'),
});
export type UploadGalleryImageResponse = z.infer<typeof UploadGalleryImageResponseSchema>;

/** 删除响应 */
export const DeleteGalleryImageResponseSchema = z.object({
  id: z.number().describe('ID'),
});
export type DeleteGalleryImageResponse = z.infer<typeof DeleteGalleryImageResponseSchema>;

/** 更新图片名称请求体 */
export const UpdateGalleryImageRequestSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(32, '图片名称长度不能超过 32 个字符').describe('名称'),
});
export type UpdateGalleryImageRequest = z.infer<typeof UpdateGalleryImageRequestSchema>;

/** 上传图片时的名称校验（multipart 字段，由路由解析后手动校验） */
export const UploadGalleryImageRequestSchema = z.object({
  name: z.string().min(1, '图片名称不能为空').max(32, '图片名称长度不能超过 32 个字符').describe('名称'),
});
export type UploadGalleryImageRequest = z.infer<typeof UploadGalleryImageRequestSchema>;

/** 更新图片名称响应 */
export const UpdateGalleryImageResponseSchema = z.object({
  id: z.number().describe('ID'),
  name: z.string().describe('名称'),
});
export type UpdateGalleryImageResponse = z.infer<typeof UpdateGalleryImageResponseSchema>;
