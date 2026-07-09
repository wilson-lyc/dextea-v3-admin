import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { initService } from './init.service.js';
import {
  InitStatusResponseSchema,
  InitRequestSchema,
  InitResponseSchema,
} from './init.type.js';

export const registerInitRoutes: FastifyPluginAsyncZod = async (app) => {
  // 初始化状态
  app.get(
    '/init/status',
    {
      schema: {
        tags: ['System Init'],
        description: '获取系统初始化状态',
        response: {
          200: ApiResponseSchema(InitStatusResponseSchema).describe('初始化状态'),
        },
      },
    },
    async (_request, _reply) => {
      const data = await initService.getInitStatus();
      return ApiResponse.success(data);
    },
  );

  // 系统初始化
  app.post(
    '/init',
    {
      schema: {
        tags: ['System Init'],
        description: '系统初始化（创建管理员账号）',
        body: InitRequestSchema,
        response: {
          200: ApiResponseSchema(InitResponseSchema).describe('初始化成功'),
        },
      },
    },
    async (request, _reply) => {
      await initService.initialize(request.body);
      return ApiResponse.success(null);
    },
  );
};
