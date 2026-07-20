import { z } from 'zod/v4';

/** 门店状态分布项 */
export const StoreStatusStatSchema = z.object({
  status: z.number().describe('状态'),
  count: z.number().describe('数量'),
});
export type StoreStatusStat = z.infer<typeof StoreStatusStatSchema>;

/** 仪表盘统计数据 */
export const DashboardStatsSchema = z.object({
  // 核心业务计数
  employeeCount: z.number().describe('员工数'),
  storeCount: z.number().describe('门店数'),
  productCount: z.number().describe('商品数'),
  menuCount: z.number().describe('菜单数'),
  ingredientCount: z.number().describe('原料数'),
  tagCount: z.number().describe('标签数'),
  customizationCount: z.number().describe('客制化数'),
  orderCount: z.number().describe('订单数'),
  // 门店状态分布
  storeStatusDistribution: z.array(StoreStatusStatSchema).describe('门店状态分布'),
});
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
