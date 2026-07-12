import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { DashboardStatsSchema } from '@dextea-admin/contracts';
import { dashboardService } from './dashboard.service.js';

export const registerDashboardRoutes: FastifyPluginAsyncZod = async (app) => {
  // 仪表盘统计
  app.get(
    '/dashboard/stats',
    {
      schema: {
        tags: ['Dashboard'],
        description: '仪表盘统计数据',
        response: {
          200: ApiResponseSchema(DashboardStatsSchema).describe('统计数据'),
        },
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, _reply) => {
      const data = await dashboardService.getStats();
      return ApiResponse.success(data);
    },
  );
};
