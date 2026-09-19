import { sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { employees, orders } from '@/plugins/db/mysql/schema.js';
import { callRpc } from '@/infrastructure/rpc/client.js';
import type { DashboardStats } from '@dextea-admin/contracts';

async function count(table: typeof employees | typeof orders): Promise<number> {
  const rows = await db.select({ count: sql<number>`count(*)` }).from(table);
  return Number(rows[0]?.count ?? 0);
}

export const dashboardRepository = {
  async getStats(): Promise<DashboardStats> {
    const [
      employeeCount,
      storeStats,
      productStats,
      orderCount,
    ] = await Promise.all([
      count(employees),
      callRpc<{ statuses?: Array<{ status: number; count: string | number }> }>('storeAdmin', 'getStoreStatistics', {}),
      callRpc<{ productCount: string | number; menuCount: string | number; ingredientCount: string | number; tagCount: string | number; customizationCount: string | number }>('productAdmin', 'getProductStats', {}),
      count(orders),
    ]);

    const storeStatusDistribution = (storeStats.statuses ?? []).map((item) => ({
      status: Number(item.status),
      count: Number(item.count ?? 0),
    }));
    const storeCount = storeStatusDistribution.reduce((total, item) => total + item.count, 0);

    return {
      employeeCount,
      storeCount,
      productCount: Number(productStats.productCount ?? 0),
      menuCount: Number(productStats.menuCount ?? 0),
      ingredientCount: Number(productStats.ingredientCount ?? 0),
      tagCount: Number(productStats.tagCount ?? 0),
      customizationCount: Number(productStats.customizationCount ?? 0),
      orderCount,
      storeStatusDistribution,
    };
  },
};
