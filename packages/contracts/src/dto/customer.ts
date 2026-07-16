import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

/** 顾客实体（列表/详情返回，不含 password） */
export const CustomerSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  /** 平台：1=微信 2=支付宝 3=Web */
  platform: z.number(),
  weixinOpenId: z.string().nullable(),
  alipayOpenId: z.string().nullable(),
  /** 状态：1=激活 0=禁用 */
  status: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Customer = z.infer<typeof CustomerSchema>;

/** 顾客列表查询（支持按状态、名称、邮箱、手机号、用户 ID 筛选） */
export const GetCustomerListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  id: z.coerce.number().int().positive().optional(),
  status: z.coerce.number().int().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});
export type GetCustomerListRequest = z.infer<typeof GetCustomerListRequestSchema>;

export const GetCustomerListResponseSchema = PaginatedDataSchema(CustomerSchema);
export type GetCustomerListResponse = z.infer<typeof GetCustomerListResponseSchema>;
