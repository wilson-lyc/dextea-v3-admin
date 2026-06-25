import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { usersTable, storesTable } from '../db/schema.js';
import { AppError, systemErrors } from '../errorcode/index.js';
import type { ApiResponse, DashboardStats } from '@dextea/shared-types';

export async function dashboardRoutes(app: FastifyInstance) {
  /** 仪表盘统计数据 */
  app.get<{
    Reply: ApiResponse<DashboardStats>;
  }>('/dashboard/stats', {
    schema: {
      description: '获取仪表盘统计数据',
      tags: ['Dashboard'],
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                employeeCount: { type: 'integer', description: '员工数量' },
                storeCount: { type: 'integer', description: '门店数量' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
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
      throw new AppError(systemErrors.DASHBOARD_STATS_FAILED);
    }
  });
}
