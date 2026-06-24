import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { usersTable, storesTable } from '../db/schema.js';
import { AppError } from '../errorcode/index.js';
import type { ApiResponse, DashboardStats } from '@dextea/shared-types';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get<{
    Reply: ApiResponse<DashboardStats>;
  }>('/dashboard/stats', async (request, reply) => {
    try {
      const db = await getDb();

      const [userCount, storeCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(usersTable),
        db.select({ count: sql<number>`count(*)` }).from(storesTable),
      ]);

      return {
        code: 0,
        data: {
          employeeCount: Number(userCount[0]?.count ?? 0),
          storeCount: Number(storeCount[0]?.count ?? 0),
        },
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError({ code: 50000, message: '获取统计数据失败', httpStatus: 500 });
    }
  });
}
