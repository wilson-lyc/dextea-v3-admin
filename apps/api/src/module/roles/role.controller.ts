import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { withPermission } from '@/middleware/authorize.js';
import { roleService } from './role.service.js';
import {
  RoleListRequestSchema,
  RoleListResponseSchema,
  RoleOptionListResponseSchema,
  CreateRoleRequestSchema,
  CreateRoleResponseSchema,
  UpdateRoleRequestSchema,
  UpdateRoleResponseSchema,
  UpdateRoleStatusRequestSchema,
  ToggleRoleStatusResponseSchema,
  RolePermissionsResponseSchema,
  SetRolePermissionsRequestSchema,
} from '@dextea-admin/contracts';

export const registerRoleRoutes: FastifyPluginAsyncZod = async (app) => {
  // 角色选项（启用状态，供员工分配角色时选择使用）
  app.get(
    '/roles/options',
    {
      schema: {
        tags: ['Roles'],
        description: '获取启用状态的角色选项',
        response: { 200: ApiResponseSchema(RoleOptionListResponseSchema).describe('角色选项列表') },
        security: [{ bearerAuth: [] }],
      },
      preHandler: withPermission('role:read'),
    },
    async (_request, _reply) => {
      const data = await roleService.getRoleOptions();
      return ApiResponse.success(data);
    },
  );

  // 角色列表（分页）
  app.get(
    '/roles',
    {
      schema: {
        tags: ['Roles'],
        description: '获取角色列表',
        querystring: RoleListRequestSchema,
        response: { 200: ApiResponseSchema(RoleListResponseSchema).describe('角色列表') },
        security: [{ bearerAuth: [] }],
      },
      preHandler: withPermission('role:read'),
    },
    async (request, _reply) => {
      const data = await roleService.getRoleList(request.query);
      return ApiResponse.success(data);
    },
  );

  // 创建角色
  app.post(
    '/roles',
    {
      schema: {
        tags: ['Roles'],
        description: '创建角色',
        body: CreateRoleRequestSchema,
        response: { 200: ApiResponseSchema(CreateRoleResponseSchema).describe('创建成功') },
        security: [{ bearerAuth: [] }],
      },
      preHandler: withPermission('role:write'),
    },
    async (request, _reply) => {
      const data = await roleService.createRole(request.body);
      return ApiResponse.success(data);
    },
  );

  // 更新角色
  app.put(
    '/roles/:id/info',
    {
      schema: {
        tags: ['Roles'],
        description: '更新角色',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateRoleRequestSchema,
        response: { 200: ApiResponseSchema(UpdateRoleResponseSchema).describe('更新成功') },
        security: [{ bearerAuth: [] }],
      },
      preHandler: withPermission('role:write'),
    },
    async (request, _reply) => {
      const data = await roleService.updateRole(request.params.id, request.body);
      return ApiResponse.success(data);
    },
  );

  // 启用/禁用角色
  app.patch(
    '/roles/:id/status',
    {
      schema: {
        tags: ['Roles'],
        description: '启用或禁用角色',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateRoleStatusRequestSchema,
        response: { 200: ApiResponseSchema(ToggleRoleStatusResponseSchema).describe('操作结果') },
        security: [{ bearerAuth: [] }],
      },
      preHandler: withPermission('role:write'),
    },
    async (request, _reply) => {
      const data = await roleService.updateRoleStatus(request.params.id, request.body.status);
      return ApiResponse.success(data);
    },
  );

  // 删除角色
  app.delete(
    '/roles/:id/info',
    {
      schema: {
        tags: ['Roles'],
        description: '删除角色',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        response: { 200: ApiResponseSchema(z.null()).describe('删除成功') },
        security: [{ bearerAuth: [] }],
      },
      preHandler: withPermission('role:write'),
    },
    async (request, _reply) => {
      await roleService.deleteRole(request.params.id);
      return ApiResponse.success(null, '删除成功');
    },
  );

  // 获取角色已绑定的权限
  app.get(
    '/roles/:id/permissions',
    {
      schema: {
        tags: ['Roles'],
        description: '获取角色已绑定的权限',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        response: { 200: ApiResponseSchema(RolePermissionsResponseSchema).describe('角色权限') },
        security: [{ bearerAuth: [] }],
      },
      preHandler: withPermission('role:read'),
    },
    async (request, _reply) => {
      const data = await roleService.getRolePermissions(request.params.id);
      return ApiResponse.success(data);
    },
  );

  // 设置角色权限（全量覆盖 = 绑定 + 解绑）
  app.put(
    '/roles/:id/permissions',
    {
      schema: {
        tags: ['Roles'],
        description: '设置角色权限（全量覆盖）',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: SetRolePermissionsRequestSchema,
        response: { 200: ApiResponseSchema(z.null()).describe('设置成功') },
        security: [{ bearerAuth: [] }],
      },
      preHandler: withPermission('role:write'),
    },
    async (request, _reply) => {
      await roleService.setRolePermissions(request.params.id, request.body);
      return ApiResponse.success(null, '设置成功');
    },
  );
};
