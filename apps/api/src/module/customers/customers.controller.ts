import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { customerService } from './customers.service.js';
import { GetCustomerListRequestSchema, GetCustomerListResponseSchema } from '@dextea-admin/contracts';

export const registerCustomerRoutes: FastifyPluginAsyncZod = async (app) => {
  // 顾客列表（支持按状态、名称、邮箱、手机号、用户 ID 筛选）
  app.get(
    '/customers',
    {
      schema: {
        tags: ['Customers'],
        description: '获取顾客列表',
        querystring: GetCustomerListRequestSchema,
        response: {
          200: ApiResponseSchema(GetCustomerListResponseSchema).describe('顾客列表'),
        },
      },
    },
    async (request, _reply) => {
      const data = await customerService.getCustomerList(request.query);
      return ApiResponse.success(data);
    },
  );
};
