import type { MySql2Database } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';
import { employeesTable, storesTable } from '../plugins/db/mysql/schema.js';

interface DashboardStatsResult {
  employeeCount: number;
  storeCount: number;
}

export async function getDashboardStats(
  db: MySql2Database<Record<string, unknown>>,
): Promise<DashboardStatsResult> {
  const [userCount, storeCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(employeesTable),
    db.select({ count: sql<number>`count(*)` }).from(storesTable),
  ]);

  return {
    employeeCount: Number(userCount[0]?.count ?? 0),
    storeCount: Number(storeCount[0]?.count ?? 0),
  };
}
