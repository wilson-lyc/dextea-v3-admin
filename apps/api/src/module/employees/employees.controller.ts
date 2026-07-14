import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { withPermission } from '@/middleware/authorize.js';
import { employeeService } from './employees.service.js';
import {
  GetEmployeeListRequestSchema,
  GetEmployeeListResponseSchema,
  CreateEmployeeRequestSchema,
  CreateEmployeeResponseSchema,
  UpdateEmployeeRequestSchema,
  UpdateEmployeeResponseSchema,
  UpdateEmployeeStatusRequestSchema,
  ToggleEmployeeStatusResponseSchema,
  ResetEmployeePasswordResponseSchema,
  EmployeeRolesResponseSchema,
  SetEmployeeRolesRequestSchema,
} from '@dextea-admin/contracts';

export const registerEmployeeRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/employees',
    {
      schema: {
        tags: ['Employees'],
        description: '获取员工列表',
        querystring: GetEmployeeListRequestSchema,
        response: {
          200: ApiResponseSchema(GetEmployeeListResponseSchema).describe('员工列表'),
        },
      },
    },
    async (request, _reply) => {
      const data = await employeeService.getEmployeeListWithPage(request.query);
      return ApiResponse.success(data);
    },
  );

  app.post(
    '/employees',
    {
      schema: {
        tags: ['Employees'],
        description: '新增员工',
        body: CreateEmployeeRequestSchema,
        response: {
          200: ApiResponseSchema(CreateEmployeeResponseSchema).describe('创建成功'),
        },
      },
    },
    async (request, _reply) => {
      const data = await employeeService.createEmployee(request.body);
      return ApiResponse.success(data);
    },
  );

  app.put(
    '/employees/:id/info',
    {
      schema: {
        tags: ['Employees'],
        description: '更新员工',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateEmployeeRequestSchema,
        response: {
          200: ApiResponseSchema(UpdateEmployeeResponseSchema).describe('更新成功'),
        },
      },
    },
    async (request, _reply) => {
      const data = await employeeService.updateEmployee(request.params.id, request.body);
      return ApiResponse.success(data);
    },
  );

  app.patch(
    '/employees/:id/status',
    {
      schema: {
        tags: ['Employees'],
        description: '启用或禁用员工',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateEmployeeStatusRequestSchema,
        response: {
          200: ApiResponseSchema(ToggleEmployeeStatusResponseSchema).describe('操作结果'),
        },
      },
    },
    async (request, _reply) => {
      const data = await employeeService.updateEmployeeStatus(request.params.id, request.body.status);
      return ApiResponse.success(data);
    },
  );

  app.post(
    '/employees/:id/reset-password',
    {
      schema: {
        tags: ['Employees'],
        description: '重置员工密码',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        response: {
          200: ApiResponseSchema(ResetEmployeePasswordResponseSchema).describe('重置成功'),
        },
      },
    },
    async (request, _reply) => {
      const data = await employeeService.resetEmployeePassword(request.params.id);
      return ApiResponse.success(data);
    },
  );

  // 获取员工已绑定的角色
  app.get(
    '/employees/:id/roles',
    {
      schema: {
        tags: ['Employees'],
        description: '获取员工已绑定的角色',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        response: {
          200: ApiResponseSchema(EmployeeRolesResponseSchema).describe('员工角色'),
        },
        security: [{ bearerAuth: [] }],
      },
      preHandler: withPermission('employee:read'),
    },
    async (request, _reply) => {
      const data = await employeeService.getEmployeeRoles(request.params.id);
      return ApiResponse.success(data);
    },
  );

  // 设置员工角色（全量覆盖 = 绑定 + 解绑）
  app.put(
    '/employees/:id/roles',
    {
      schema: {
        tags: ['Employees'],
        description: '设置员工角色（全量覆盖）',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: SetEmployeeRolesRequestSchema,
        response: {
          200: ApiResponseSchema(z.null()).describe('设置成功'),
        },
        security: [{ bearerAuth: [] }],
      },
      preHandler: withPermission('employee:write'),
    },
    async (request, _reply) => {
      await employeeService.setEmployeeRoles(request.params.id, request.body);
      return ApiResponse.success(null, '设置成功');
    },
  );
};
