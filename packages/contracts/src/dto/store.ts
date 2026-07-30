import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';
import { STORE_STATUS_VALUES, type StoreStatus } from '../enums/store.js';

/** 门店实体 */
export const StoreSchema = z.object({
  id: z.number().describe('ID'),
  name: z.string().describe('名称'),
  /** 省 */
  province: z.string().describe('省'),
  /** 市 */
  city: z.string().describe('市'),
  /** 区/县 */
  district: z.string().describe('区/县'),
  address: z.string().describe('详细地址'),
  status: z.number().describe('状态（0=休息中 1=营业中 2=筹备中 3=已注销）'),
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
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('每页条数'),
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
  name: z.string().min(1, '门店名称不能为空').describe('名称'),
  province: z.string().optional().describe('省'),
  city: z.string().optional().describe('市'),
  district: z.string().optional().describe('区/县'),
  address: z.string().optional().describe('详细地址'),
  businessHours: z.string().optional().describe('营业时间'),
  phone: z.string().min(1, '联系电话不能为空').describe('手机号'),
  account: z.string().min(1, '登录账号不能为空').describe('登录账号'),
  email: z.string().optional().describe('邮箱'),
  longitude: z.number().optional().describe('经度'),
  latitude: z.number().optional().describe('纬度'),
});
export type CreateStoreRequest = z.infer<typeof CreateStoreRequestSchema>;

export const CreateStoreResponseSchema = z.object({
  id: z.number().describe('ID'),
  initialPassword: z.string().describe('初始密码'),
});
export type CreateStoreResponse = z.infer<typeof CreateStoreResponseSchema>;

/** 更新门店 */
export const UpdateStoreRequestSchema = z.object({
  name: z.string().min(1, '门店名称不能为空').describe('名称'),
  province: z.string().optional().describe('省'),
  city: z.string().optional().describe('市'),
  district: z.string().optional().describe('区/县'),
  address: z.string().optional().describe('详细地址'),
  status: StoreStatusSchema.optional().describe('状态（0=休息中 1=营业中 2=筹备中 3=已注销）'),
  businessHours: z.string().optional().describe('营业时间'),
  phone: z.string().optional().describe('手机号'),
  longitude: z.number().optional().describe('经度'),
  latitude: z.number().optional().describe('纬度'),
});
export type UpdateStoreRequest = z.infer<typeof UpdateStoreRequestSchema>;

export const UpdateStoreResponseSchema = z.object({
  id: z.number().describe('ID'),
});
export type UpdateStoreResponse = z.infer<typeof UpdateStoreResponseSchema>;

/** 更新门店基础信息 */
export const UpdateStoreBasicInfoRequestSchema = z.object({
  name: z.string().min(1, '门店名称不能为空').describe('名称'),
  phone: z.string().optional().describe('手机号'),
  businessHours: z.string().optional().describe('营业时间'),
  email: z.string().optional().describe('邮箱'),
});
export type UpdateStoreBasicInfoRequest = z.infer<typeof UpdateStoreBasicInfoRequestSchema>;

export const UpdateStoreBasicInfoResponseSchema = z.object({
  id: z.number().describe('ID'),
});
export type UpdateStoreBasicInfoResponse = z.infer<typeof UpdateStoreBasicInfoResponseSchema>;

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
  status: StoreStatusSchema.describe('状态（0=休息中 1=营业中 2=筹备中 3=已注销）'),
});
export type UpdateStoreStatusRequest = z.infer<typeof UpdateStoreStatusRequestSchema>;

export const UpdateStoreStatusResponseSchema = z.object({
  status: z.number().describe('状态（0=休息中 1=营业中 2=筹备中 3=已注销）'),
});
export type UpdateStoreStatusResponse = z.infer<typeof UpdateStoreStatusResponseSchema>;

/** 重置门店密码 */
export const ResetStorePasswordResponseSchema = z.object({
  newPassword: z.string().describe('新密码'),
});
export type ResetStorePasswordResponse = z.infer<typeof ResetStorePasswordResponseSchema>;

/** 绑定门店菜单 */
export const BindStoreMenuRequestSchema = z.object({
  menuId: z.number().nullable().describe('菜单ID'),
});
export type BindStoreMenuRequest = z.infer<typeof BindStoreMenuRequestSchema>;

export const BindStoreMenuResponseSchema = z.object({
  id: z.number().describe('ID'),
});
export type BindStoreMenuResponse = z.infer<typeof BindStoreMenuResponseSchema>;

/** 同步门店定位数据 */
export const SyncLocationsResponseSchema = z.object({
  synced: z.number().describe('已同步数量'),
});
export type SyncLocationsResponse = z.infer<typeof SyncLocationsResponseSchema>;
