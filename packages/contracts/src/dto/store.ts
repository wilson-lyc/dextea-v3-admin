import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';
import { STORE_STATUS_VALUES, type StoreStatus } from '../status/store.js';

/** 门店实体 */
export const StoreSchema = z.object({
  id: z.number(),
  name: z.string(),
  /** 行政区划代码（6 位，最细一级） */
  regionCode: z.string(),
  /** 以下为根据 regionCode 反查得到的展示用名称（可选） */
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  address: z.string(),
  status: z.number(),
  businessHours: z.string(),
  phone: z.string(),
  longitude: z.number(),
  latitude: z.number(),
  account: z.string(),
  email: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Store = z.infer<typeof StoreSchema>;

/**
 * 门店状态校验 Schema
 * 合法性完全由契约包中的 STORE_STATUS_VALUES 决定，保证「单一真源」：
 * 新增/调整状态时只需改动 status/store.ts，无需同步此处。
 */
export const StoreStatusSchema = z
  .number()
  .refine((v) => STORE_STATUS_VALUES.includes(v as StoreStatus), {
    message: '门店状态值不合法',
  });
export type StoreStatusValue = z.infer<typeof StoreStatusSchema>;

/** 获取门店列表 */
export const StoreListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
});
export type StoreListRequest = z.infer<typeof StoreListRequestSchema>;

export const StoreListResponseSchema = PaginatedDataSchema(StoreSchema);
export type StoreListResponse = z.infer<typeof StoreListResponseSchema>;

/** 获取门店详情 */
export const StoreGetResponseSchema = StoreSchema;
export type StoreGetResponse = Store;

/** 新增门店 */
export const CreateStoreRequestSchema = z.object({
  name: z.string().min(1, '门店名称不能为空'),
  regionCode: z.string().optional(),
  address: z.string().optional(),
  businessHours: z.string().optional(),
  phone: z.string().min(1, '联系电话不能为空'),
  account: z.string().min(1, '登录账号不能为空'),
  email: z.string().optional(),
  longitude: z.number().optional(),
  latitude: z.number().optional(),
});
export type CreateStoreRequest = z.infer<typeof CreateStoreRequestSchema>;

export const CreateStoreResponseSchema = z.object({
  id: z.number(),
  initialPassword: z.string(),
});
export type CreateStoreResponse = z.infer<typeof CreateStoreResponseSchema>;

/** 更新门店 */
export const UpdateStoreRequestSchema = z.object({
  name: z.string().min(1, '门店名称不能为空'),
  regionCode: z.string().optional(),
  address: z.string().optional(),
  status: StoreStatusSchema.optional(),
  businessHours: z.string().optional(),
  phone: z.string().optional(),
  longitude: z.number().optional(),
  latitude: z.number().optional(),
});
export type UpdateStoreRequest = z.infer<typeof UpdateStoreRequestSchema>;

export const UpdateStoreResponseSchema = z.object({
  id: z.number(),
});
export type UpdateStoreResponse = z.infer<typeof UpdateStoreResponseSchema>;

/** 更新门店基础信息 */
export const UpdateStoreBasicInfoRequestSchema = z.object({
  name: z.string().min(1, '门店名称不能为空'),
  phone: z.string().optional(),
  businessHours: z.string().optional(),
  email: z.string().optional(),
});
export type UpdateStoreBasicInfoRequest = z.infer<typeof UpdateStoreBasicInfoRequestSchema>;

export const UpdateStoreBasicInfoResponseSchema = z.object({
  id: z.number(),
});
export type UpdateStoreBasicInfoResponse = z.infer<typeof UpdateStoreBasicInfoResponseSchema>;

/** 更新门店位置 */
export const UpdateStoreLocationRequestSchema = z.object({
  regionCode: z.string().optional(),
  address: z.string().optional(),
  longitude: z.number(),
  latitude: z.number(),
});
export type UpdateStoreLocationRequest = z.infer<typeof UpdateStoreLocationRequestSchema>;

export const UpdateStoreLocationResponseSchema = z.object({
  id: z.number(),
});
export type UpdateStoreLocationResponse = z.infer<typeof UpdateStoreLocationResponseSchema>;

/** 更新门店状态 */
export const UpdateStoreStatusRequestSchema = z.object({
  status: StoreStatusSchema,
});
export type UpdateStoreStatusRequest = z.infer<typeof UpdateStoreStatusRequestSchema>;

export const UpdateStoreStatusResponseSchema = z.object({
  status: z.number(),
});
export type UpdateStoreStatusResponse = z.infer<typeof UpdateStoreStatusResponseSchema>;

/** 重置门店密码 */
export const ResetStorePasswordResponseSchema = z.object({
  newPassword: z.string(),
});
export type ResetStorePasswordResponse = z.infer<typeof ResetStorePasswordResponseSchema>;

/** 绑定门店菜单 */
export const BindStoreMenuRequestSchema = z.object({
  menuId: z.number().nullable(),
});
export type BindStoreMenuRequest = z.infer<typeof BindStoreMenuRequestSchema>;

export const BindStoreMenuResponseSchema = z.object({
  id: z.number(),
});
export type BindStoreMenuResponse = z.infer<typeof BindStoreMenuResponseSchema>;

/** 同步门店定位数据 */
export const SyncLocationsResponseSchema = z.object({
  synced: z.number(),
});
export type SyncLocationsResponse = z.infer<typeof SyncLocationsResponseSchema>;
