import { sql } from 'drizzle-orm';
import type { AnyMySqlTable } from 'drizzle-orm/mysql-core';
import { db } from '@/plugins/db/mysql/index.js';
import {
  employees,
  stores,
  products,
  menus,
  ingredients,
  productTags,
  customizations,
  orders,
} from '@/plugins/db/mysql/schema.js';
import type { DashboardStats } from '@dextea-admin/contracts';

async function count(table: AnyMySqlTable): Promise<number> {
  const rows = await db.select({ count: sql<number>`count(*)` }).from(table);
  return Number(rows[0]?.count ?? 0);
}

export const dashboardRepository = {
  async getStats(): Promise<DashboardStats> {
    const [
      employeeCount,
      storeCount,
      productCount,
      menuCount,
      ingredientCount,
      tagCount,
      customizationCount,
      orderCount,
      storeStatusDistribution,
    ] = await Promise.all([
      count(employees),
      count(stores),
      count(products),
      count(menus),
      count(ingredients),
      count(productTags),
      count(customizations),
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
      productCount,
      menuCount,
      ingredientCount,
      tagCount,
      customizationCount,
      orderCount,
      storeStatusDistribution,
    };
  },
};
