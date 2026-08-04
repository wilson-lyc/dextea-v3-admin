import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';
import { STORE_STATUS_VALUES, type StoreStatus } from '../enums/store.js';

/** 门店实体 */
export const StoreSchema = z.object({
  id: z.number().describe('ID'),
  name: z.string().describe('名称'),
  province: z.string().describe('省'),
  city: z.string().describe('市'),
  district: z.string().describe('区/县'),
  address: z.string().describe('详细地址'),
  status: z.number().describe('状态'),
  businessHours: z.string().describe('营业时间'),
  phone: z.string().describe('手机号'),
  longitude: z.number().describe('经度'),
  latitude: z.number().describe('纬度'),
  account: z.string().describe('登录账号'),
  email: z.string().describe('邮箱'),
  createdAt: z.string().describe('创建时间'),
  updatedAt: z.string().describe('更新时间'),
});
export type Store = z.infer<typeof StoreSchema>;

/** 门店状态 */
export const StoreStatusSchema = z
  .number()
  .refine((v) => STORE_STATUS_VALUES.includes(v as StoreStatus), {
    message: '门店状态值不合法',
  });
export type StoreStatusValue = z.infer<typeof StoreStatusSchema>;

/** 获取门店列表 */
export const StoreListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('页大小'),
  keyword: z.string().optional().describe('关键字'),
});
export type StoreListRequest = z.infer<typeof StoreListRequestSchema>;

export const StoreListResponseSchema = PaginatedDataSchema(StoreSchema);
export type StoreListResponse = z.infer<typeof StoreListResponseSchema>;

/** 获取门店详情 */
export const StoreGetResponseSchema = StoreSchema;
export type StoreGetResponse = Store;

/** 新增门店 */
export const CreateStoreRequestSchema = z.object({
  name: z.string().min(1, '门店名称不能为空').max(255, '门店名称过长').describe('名称'),
  province: z.string().max(50, '省份过长').optional().describe('省'),
  city: z.string().max(50, '城市过长').optional().describe('市'),
  district: z.string().max(50, '区/县过长').optional().describe('区/县'),
  address: z.string().max(500, '详细地址过长').optional().describe('详细地址'),
  businessHours: z.string().max(255, '营业时间过长').optional().describe('营业时间'),
  phone: z.string().min(1, '联系电话不能为空').max(50, '联系电话过长').describe('手机号'),
  account: z.string().min(1, '登录账号不能为空').max(255, '登录账号过长').describe('登录账号'),
  email: z.string().max(255, '邮箱过长').optional().describe('邮箱'),
  longitude: z.number().optional().describe('经度'),
  latitude: z.number().optional().describe('纬度'),
});
export type CreateStoreRequest = z.infer<typeof CreateStoreRequestSchema>;

export const CreateStoreResponseSchema = z.object({
  initialPassword: z.string().describe('初始密码'),
});
export type CreateStoreResponse = z.infer<typeof CreateStoreResponseSchema>;

/** 更新门店基础信息 */
export const UpdateStoreProfileRequestSchema = z.object({
  name: z.string().min(1, '门店名称不能为空').describe('名称'),
  phone: z.string().optional().describe('手机号'),
  businessHours: z.string().optional().describe('营业时间'),
  email: z.string().optional().describe('邮箱'),
});
export type UpdateStoreProfileRequest = z.infer<typeof UpdateStoreProfileRequestSchema>;

export const UpdateStoreProfileResponseSchema = z.object({
  id: z.number().describe('ID'),
});
export type UpdateStoreProfileResponse = z.infer<typeof UpdateStoreProfileResponseSchema>;

/** 更新门店位置 */
export const UpdateStoreLocationRequestSchema = z.object({
  province: z.string().optional().describe('省'),
  city: z.string().optional().describe('市'),
  district: z.string().optional().describe('区/县'),
  address: z.string().optional().describe('详细地址'),
  longitude: z.number().describe('经度'),
  latitude: z.number().describe('纬度'),
});
export type UpdateStoreLocationRequest = z.infer<typeof UpdateStoreLocationRequestSchema>;

export const UpdateStoreLocationResponseSchema = z.object({
  id: z.number().describe('ID'),
});
export type UpdateStoreLocationResponse = z.infer<typeof UpdateStoreLocationResponseSchema>;

/** 更新门店状态 */
export const UpdateStoreStatusRequestSchema = z.object({
  status: StoreStatusSchema.describe('状态'),
});
export type UpdateStoreStatusRequest = z.infer<typeof UpdateStoreStatusRequestSchema>;

export const UpdateStoreStatusResponseSchema = z.object({
  status: z.number().describe('状态'),
});
export type UpdateStoreStatusResponse = z.infer<typeof UpdateStoreStatusResponseSchema>;

/** 重置门店密码 */
export const ResetStorePasswordResponseSchema = z.object({
  newPassword: z.string().describe('新密码'),
});
export type ResetStorePasswordResponse = z.infer<typeof ResetStorePasswordResponseSchema>;

/** 同步门店定位数据 */
export const SyncLocationsResponseSchema = z.object({
  synced: z.number().describe('已同步数量'),
});
export type SyncLocationsResponse = z.infer<typeof SyncLocationsResponseSchema>;
