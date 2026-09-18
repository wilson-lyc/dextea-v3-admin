import { sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { employees, stores, orders } from '@/plugins/db/mysql/schema.js';
import { callRpc } from '@/infrastructure/rpc/client.js';
import type { DashboardStats } from '@dextea-admin/contracts';

async function count(table: typeof employees | typeof stores | typeof orders): Promise<number> {
  const rows = await db.select({ count: sql<number>`count(*)` }).from(table);
  return Number(rows[0]?.count ?? 0);
}

export const dashboardRepository = {
  async getStats(): Promise<DashboardStats> {
    const [
      employeeCount,
      storeCount,
      productStats,
      orderCount,
      storeStatusDistribution,
    ] = await Promise.all([
      count(employees),
      count(stores),
      callRpc<{ productCount: string | number; menuCount: string | number; ingredientCount: string | number; tagCount: string | number; customizationCount: string | number }>('product', 'getProductStats', {}),
      count(orders),
      db
        .select({ status: stores.status, count: sql<number>`count(*)` })
        .from(stores)
        .groupBy(stores.status)
        .then((rows) =>
          rows.map((r) => ({ status: r.status, count: Number(r.count) })),
        ),
    ]);

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
