import { z } from 'zod/v4';

/** 门店状态分布项 */
export const StoreStatusStatSchema = z.object({
  status: z.number(),
  count: z.number(),
});
export type StoreStatusStat = z.infer<typeof StoreStatusStatSchema>;

/** 仪表盘统计数据 */
export const DashboardStatsSchema = z.object({
  // 核心业务计数
  employeeCount: z.number(),
  storeCount: z.number(),
  productCount: z.number(),
  menuCount: z.number(),
  ingredientCount: z.number(),
  tagCount: z.number(),
  customizationCount: z.number(),
  orderCount: z.number(),
  // 门店状态分布
  storeStatusDistribution: z.array(StoreStatusStatSchema),
});
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
