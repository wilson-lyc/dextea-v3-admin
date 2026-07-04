import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { AppError } from '../errorcode/index.js';
import { employeeErrors } from '../errorcode/employees.js';
import { parsePositiveInt } from '../utils/validation.js';
import { listEmployees, createEmployee, updateEmployee, toggleEmployeeStatus } from '../services/employee.service.js';
import type {
  ApiResponse,
  PaginatedData,
  Employee,
  EmployeeQuery,
} from '@dextea/shared-types';

export async function employeeRoutes(app: FastifyInstance) {
  /** 员工列表 */
  app.get<{
    Querystring: EmployeeQuery;
    Reply: ApiResponse<PaginatedData<Employee>>;
  }>('/employees', {
    schema: {
      description: '获取员工列表',
      tags: ['Employees'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码' },
          pageSize: { type: 'string', description: '每页数量' },
          keyword: { type: 'string', description: '搜索关键词（邮箱/用户名）' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      email: { type: 'string' },
                      displayName: { type: 'string' },
                      status: { type: 'integer', description: '0=禁用 1=激活' },
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' },
                    },
                  },
                },
                total: { type: 'integer' },
                page: { type: 'integer' },
                pageSize: { type: 'integer' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const keyword = request.query.keyword?.trim();

      const data = await listEmployees(db, { page, pageSize, keyword });

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(employeeErrors.LIST_FAILED);
    }
  });

  /** 新增员工 */
  app.post<{
    Body: { email: string; displayName: string };
    Reply: ApiResponse<{ user: { id: number; email: string; displayName: string; status: number }; initialPassword: string }>;
  }>('/employees', {
    schema: {
      description: '新增员工',
      tags: ['Employees'],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', minLength: 1, description: '邮箱' },
          displayName: { type: 'string', minLength: 1, description: '显示名称' },
        },
        required: ['email', 'displayName'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    email: { type: 'string' },
                    displayName: { type: 'string' },
                    status: { type: 'integer', description: '0=禁用 1=激活' },
                  },
                },
                initialPassword: { type: 'string', description: '初始密码' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const data = await createEmployee(db, request.body);

      return {
        code: 0,
        data,
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(employeeErrors.CREATE_FAILED);
    }
  });

  /** 更新员工 */
  app.put<{
    Params: { id: string };
    Body: { email: string; displayName: string };
    Reply: ApiResponse<{ id: number; email: string; displayName: string }>;
  }>('/employees/:id', {
    schema: {
      description: '更新员工',
      tags: ['Employees'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '员工ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', minLength: 1, description: '邮箱' },
          displayName: { type: 'string', minLength: 1, description: '显示名称' },
        },
        required: ['email', 'displayName'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                email: { type: 'string' },
                displayName: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '员工ID');
      const data = await updateEmployee(db, id, request.body);

      return {
        code: 0,
        data,
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(employeeErrors.UPDATE_FAILED);
    }
  });

  /** 启用/禁用员工 */
  app.put<{
    Params: { id: string };
    Reply: ApiResponse<{ email: string; status: number }>;
  }>('/employees/:id/status', {
    schema: {
      description: '启用或禁用员工',
      tags: ['Employees'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '员工ID' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                email: { type: 'string', description: '员工邮箱' },
                status: { type: 'integer', description: '0=禁用 1=激活' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '员工ID');
      const data = await toggleEmployeeStatus(db, id);

      return {
        code: 0,
        data,
        message: data.status === 1 ? '已激活' : '已禁用',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(employeeErrors.OPERATE_FAILED);
    }
  });
}
