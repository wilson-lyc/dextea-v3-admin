import { z } from 'zod/v4';
import { PaginatedDataSchema } from '@/common/types/index.js';

// 状态枚举：数据库用数字表示门店状态

export const STORE_STATUS = {
  RESTING:   { key: 'resting',   value: 0 },
  OPEN:      { key: 'open',      value: 1 },
  PREPARING: { key: 'preparing', value: 2 },
  CLOSED:    { key: 'closed',    value: 3 },
} as const;

export type StoreStatus = (typeof STORE_STATUS)[keyof typeof STORE_STATUS]['value'];
export const STORE_STATUS_VALUES: readonly StoreStatus[] = [0, 1, 2, 3];

// 实体：门店

export const StoreSchema = z.object({
  id: z.number(),
  name: z.string(),
  regionCode: z.string(),
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

// 获取门店列表

export const StoreListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
});
export type StoreListRequest = z.infer<typeof StoreListRequestSchema>;

export const StoreListResponseSchema = PaginatedDataSchema(StoreSchema);
export type StoreListResponse = z.infer<typeof StoreListResponseSchema>;

// 获取门店详情

export const StoreGetResponseSchema = StoreSchema;
export type StoreGetResponse = Store;

// 新增门店

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

// 更新门店

export const UpdateStoreRequestSchema = z.object({
  name: z.string().min(1, '门店名称不能为空'),
  regionCode: z.string().optional(),
  address: z.string().optional(),
  status: z.number().optional(),
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

// 更新门店基础信息

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

// 更新门店位置

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

// 更新门店状态

export const UpdateStoreStatusRequestSchema = z.object({
  status: z.number(),
});
export type UpdateStoreStatusRequest = z.infer<typeof UpdateStoreStatusRequestSchema>;

export const UpdateStoreStatusResponseSchema = z.object({
  status: z.number(),
});
export type UpdateStoreStatusResponse = z.infer<typeof UpdateStoreStatusResponseSchema>;

// 重置门店密码

export const ResetStorePasswordResponseSchema = z.object({
  newPassword: z.string(),
});
export type ResetStorePasswordResponse = z.infer<typeof ResetStorePasswordResponseSchema>;

// 绑定门店菜单

export const BindStoreMenuRequestSchema = z.object({
  menuId: z.number().nullable(),
});
export type BindStoreMenuRequest = z.infer<typeof BindStoreMenuRequestSchema>;

export const BindStoreMenuResponseSchema = z.object({
  id: z.number(),
});
export type BindStoreMenuResponse = z.infer<typeof BindStoreMenuResponseSchema>;

// 同步门店定位数据

export const SyncLocationsResponseSchema = z.object({
  synced: z.number(),
});
export type SyncLocationsResponse = z.infer<typeof SyncLocationsResponseSchema>;
