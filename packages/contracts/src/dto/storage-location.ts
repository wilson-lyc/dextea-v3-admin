import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

// ─── 存储位置状态枚举见 @dextea-admin/contracts/status (STORAGE_LOCATION_STATUS) ───

/** 存储位置实体（详情 / 列表项）。
 * 安全：secretKey 由后端脱敏返回（统一 `********`），accessKey 原样返回。 */
export const StorageLocationSchema = z.object({
  id: z.number(),
  /** 用户自定义名称 */
  name: z.string(),
  /** 存储厂商（aws / aliyun / tencent / minio / generic） */
  provider: z.string(),
  /** S3 区域 */
  region: z.string(),
  /** 自定义端点（S3 兼容服务地址） */
  endpoint: z.string(),
  /** 存储桶名称 */
  bucket: z.string(),
  /** 访问密钥 ID */
  accessKey: z.string(),
  /** 私密访问密钥（脱敏返回，恒为 `********`） */
  secretKey: z.string(),
  /** 强制路径风格 */
  forcePathStyle: z.boolean(),
  /** 存储桶公网基础地址 */
  publicBaseUrl: z.string(),
  /** 启用状态：0=禁用 1=启用 */
  status: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StorageLocation = z.infer<typeof StorageLocationSchema>;

/** 存储位置列表查询 */
export const StorageLocationListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
});
export type StorageLocationListRequest = z.infer<typeof StorageLocationListRequestSchema>;

export const StorageLocationListResponseSchema = PaginatedDataSchema(StorageLocationSchema);
export type StorageLocationListResponse = z.infer<typeof StorageLocationListResponseSchema>;

/** 新增存储位置（密钥为明文，落库前由后端加密） */
export const CreateStorageLocationRequestSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(255, '名称过长'),
  provider: z.string().min(1, '厂商不能为空'),
  region: z.string().min(1, '区域不能为空'),
  endpoint: z.string().min(1, '端点不能为空'),
  bucket: z.string().min(1, '桶名不能为空'),
  accessKey: z.string().min(1, 'AccessKey 不能为空'),
  secretKey: z.string().min(1, 'SecretKey 不能为空'),
  forcePathStyle: z.boolean().optional().default(false),
  publicBaseUrl: z.string().min(1, '公网基础地址不能为空'),
  status: z.number().optional().default(1),
});
export type CreateStorageLocationRequest = z.infer<typeof CreateStorageLocationRequestSchema>;

export const CreateStorageLocationResponseSchema = z.object({ id: z.number() });
export type CreateStorageLocationResponse = z.infer<typeof CreateStorageLocationResponseSchema>;

/** 更新存储位置（全部可选；secretKey 留空表示保留原值，不重新加密） */
export const UpdateStorageLocationRequestSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(255, '名称过长').optional(),
  provider: z.string().min(1, '厂商不能为空').optional(),
  region: z.string().min(1, '区域不能为空').optional(),
  endpoint: z.string().min(1, '端点不能为空').optional(),
  bucket: z.string().min(1, '桶名不能为空').optional(),
  accessKey: z.string().min(1, 'AccessKey 不能为空').optional(),
  /** 留空 = 保留原 SecretKey（沿用库中既有密文） */
  secretKey: z.string().optional(),
  forcePathStyle: z.boolean().optional(),
  publicBaseUrl: z.string().min(1, '公网基础地址不能为空').optional(),
  status: z.number().optional(),
});
export type UpdateStorageLocationRequest = z.infer<typeof UpdateStorageLocationRequestSchema>;

export const UpdateStorageLocationResponseSchema = StorageLocationSchema;
export type UpdateStorageLocationResponse = StorageLocation;

/** 存储位置下拉选项 */
export const StorageLocationOptionSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.number(),
});
export type StorageLocationOption = z.infer<typeof StorageLocationOptionSchema>;

export const StorageLocationOptionsResponseSchema = z.array(StorageLocationOptionSchema);
export type StorageLocationOptionsResponse = z.infer<typeof StorageLocationOptionsResponseSchema>;

/** 测试连接请求（使用所填明文配置临时探测，不落库） */
export const TestStorageLocationConnectionRequestSchema = z.object({
  region: z.string().min(1, '区域不能为空'),
  provider: z.string().min(1, '厂商不能为空'),
  endpoint: z.string().min(1, '端点不能为空'),
  bucket: z.string().min(1, '桶名不能为空'),
  accessKey: z.string().min(1, 'AccessKey 不能为空'),
  secretKey: z.string().min(1, 'SecretKey 不能为空'),
  forcePathStyle: z.boolean().optional().default(false),
  publicBaseUrl: z.string().min(1, '公网基础地址不能为空'),
});
export type TestStorageLocationConnectionRequest = z.infer<
  typeof TestStorageLocationConnectionRequestSchema
>;

export const TestStorageLocationConnectionResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
});
export type TestStorageLocationConnectionResponse = z.infer<
  typeof TestStorageLocationConnectionResponseSchema
>;
