import type { FastifyInstance } from 'fastify';
import { getDb } from '../plugins/db/mysql/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { getDashboardStats } from '../services/dashboard.service.js';
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
      const data = await getDashboardStats(db);

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError({ code: 10008, message: '获取统计数据失败' }, undefined, 200);
    }
  });
}
