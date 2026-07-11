import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { authService } from './auth.service.js';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  AuthMeResponseSchema,
  LogoutResponseSchema,
} from '@dextea-admin/contracts';

export const registerAuthRoutes: FastifyPluginAsyncZod = async (app) => {
  // 获取当前用户信息
  app.get(
    '/auth/me',
    {
      schema: {
        tags: ['Auth'],
        description: '获取当前登录用户信息',
        security: [{ bearerAuth: [] }],
        response: {
          200: ApiResponseSchema(AuthMeResponseSchema).describe('当前用户信息'),
        },
      },
    },
    async (request, _reply) => {
      const { userId, email, displayName } = request.authEmployee!;
      return ApiResponse.success({
        user: { id: userId, email, displayName },
      });
    },
  );

  // 用户登录
  app.post(
    '/auth/login',
    {
      schema: {
        tags: ['Auth'],
        description: '用户登录',
        body: LoginRequestSchema,
        response: {
          200: ApiResponseSchema(LoginResponseSchema).describe('登录成功'),
        },
      },
    },
    async (request, _reply) => {
      const { account, password } = request.body;
      const data = await authService.login(account, password, request.server.redis);
      return ApiResponse.success(data);
    },
  );

  // 退出登录
  app.post(
    '/auth/logout',
    {
      schema: {
        tags: ['Auth'],
        description: '退出登录',
        security: [{ bearerAuth: [] }],
        response: {
          200: ApiResponseSchema(LogoutResponseSchema).describe('退出成功'),
        },
      },
    },
    async (request, _reply) => {
      const authHeader = request.headers.authorization;
      await authService.logout(authHeader, request.server.redis);
      return ApiResponse.success(null);
    },
  );
};
