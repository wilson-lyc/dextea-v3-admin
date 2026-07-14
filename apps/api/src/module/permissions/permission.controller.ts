import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { withPermission } from '@/middleware/authorize.js';
import { permissionService } from './permission.service.js';
import {
  PermissionListRequestSchema,
  PermissionListResponseSchema,
  PermissionOptionListResponseSchema,
} from '@dextea-admin/contracts';

export const registerPermissionRoutes: FastifyPluginAsyncZod = async (app) => {
  // 权限选项（全部权限，供角色分配权限时选择使用）
  app.get(
    '/permissions/options',
    {
      schema: {
        tags: ['Permissions'],
        description: '获取全部权限选项',
        response: {
          200: ApiResponseSchema(PermissionOptionListResponseSchema).describe('权限选项列表'),
        },
        security: [{ bearerAuth: [] }],
      },
      preHandler: withPermission('permission:read'),
    },
    async (_request, _reply) => {
      const data = await permissionService.getPermissionOptions();
      return ApiResponse.success(data);
    },
  );

  // 权限列表（分页）
  app.get(
    '/permissions',
    {
      schema: {
        tags: ['Permissions'],
        description: '获取权限列表',
        querystring: PermissionListRequestSchema,
        response: {
          200: ApiResponseSchema(PermissionListResponseSchema).describe('权限列表'),
        },
        security: [{ bearerAuth: [] }],
      },
      preHandler: withPermission('permission:read'),
    },
    async (request, _reply) => {
      const data = await permissionService.getPermissionList(request.query);
      return ApiResponse.success(data);
    },
  );
};
