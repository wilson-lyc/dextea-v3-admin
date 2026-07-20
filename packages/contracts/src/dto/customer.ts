import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

/** 顾客实体（列表/详情返回，不含 password） */
export const CustomerSchema = z.object({
  id: z.number().describe('ID'),
  name: z.string().nullable().describe('名称'),
  email: z.string().nullable().describe('邮箱'),
  phone: z.string().nullable().describe('手机号'),
  /** 平台：1=微信 2=支付宝 3=Web */
  platform: z.number().describe('注册平台（1=微信 2=支付宝 3=Web）'),
  weixinOpenId: z.string().nullable().describe('微信OpenID'),
  alipayOpenId: z.string().nullable().describe('支付宝OpenID'),
  /** 状态：1=激活 0=禁用 */
  status: z.number().describe('状态（0=禁用 1=激活）'),
  createdAt: z.string().describe('创建时间'),
  updatedAt: z.string().describe('更新时间'),
});
export type Customer = z.infer<typeof CustomerSchema>;

/** 顾客列表查询（支持按状态、名称、邮箱、手机号、用户 ID 筛选） */
export const GetCustomerListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('每页条数'),
  id: z.coerce.number().int().positive().optional().describe('ID'),
  status: z.coerce.number().int().optional().describe('状态（0=禁用 1=激活）'),
  name: z.string().optional().describe('名称'),
  email: z.string().optional().describe('邮箱'),
  phone: z.string().optional().describe('手机号'),
});
export type GetCustomerListRequest = z.infer<typeof GetCustomerListRequestSchema>;

export const GetCustomerListResponseSchema = PaginatedDataSchema(CustomerSchema);
export type GetCustomerListResponse = z.infer<typeof GetCustomerListResponseSchema>;
