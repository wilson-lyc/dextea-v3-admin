import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { configService } from './config.service.js';
import { AmapConfigResponseSchema } from './config.type.js';

export const registerConfigRoutes: FastifyPluginAsyncZod = async (app) => {
  // 高德地图密钥
  app.get(
    '/config/amap-key',
    {
      schema: {
        tags: ['Config'],
        description: '获取高德地图密钥配置',
        response: {
          200: ApiResponseSchema(AmapConfigResponseSchema).describe('高德地图密钥'),
        },
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, _reply) => {
      const data = await configService.getAmapConfig();
      return ApiResponse.success(data);
    },
  );
};
