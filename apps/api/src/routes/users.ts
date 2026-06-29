import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { AppError } from '../errorcode/index.js';
import { userErrors } from '../errorcode/users.js';
import { parsePositiveInt } from '../utils/validation.js';
import { listUsers, createUser, updateUser, toggleUserStatus } from '../services/user.service.js';
import type {
  ApiResponse,
  PaginatedData,
  User,
  UserQuery,
} from '@dextea/shared-types';

export async function userRoutes(app: FastifyInstance) {
  /** 用户列表 */
  app.get<{
    Querystring: UserQuery;
    Reply: ApiResponse<PaginatedData<User>>;
  }>('/users', {
    schema: {
      description: '获取用户列表',
      tags: ['Users'],
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

      const data = await listUsers(db, { page, pageSize, keyword });

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(userErrors.LIST_FAILED);
    }
  });

  /** 新增用户 */
  app.post<{
    Body: { email: string; displayName: string };
    Reply: ApiResponse<{ user: { id: number; email: string; displayName: string; status: number }; initialPassword: string }>;
  }>('/users', {
    schema: {
      description: '新增用户',
      tags: ['Users'],
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
      const data = await createUser(db, request.body);

      return {
        code: 0,
        data,
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(userErrors.CREATE_FAILED);
    }
  });

  /** 更新用户 */
  app.put<{
    Params: { id: string };
    Body: { email: string; displayName: string; status: number };
    Reply: ApiResponse<{ id: number; email: string; displayName: string; status: number }>;
  }>('/users/:id', {
    schema: {
      description: '更新用户',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '用户ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', minLength: 1, description: '邮箱' },
          displayName: { type: 'string', minLength: 1, description: '显示名称' },
          status: { type: 'integer', description: '0=禁用 1=激活' },
        },
        required: ['email', 'displayName', 'status'],
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
      const id = parsePositiveInt(request.params.id, '用户ID');
      const data = await updateUser(db, id, request.body);

      return {
        code: 0,
        data,
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(userErrors.UPDATE_FAILED);
    }
  });

  /** 启用/禁用用户 */
  app.patch<{
    Params: { id: string };
    Reply: ApiResponse<{ status: number }>;
  }>('/users/:id/status', {
    schema: {
      description: '启用或禁用用户',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '用户ID' },
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
      const id = parsePositiveInt(request.params.id, '用户ID');
      const data = await toggleUserStatus(db, id);

      return {
        code: 0,
        data,
        message: data.status === 1 ? '已激活' : '已禁用',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(userErrors.OPERATE_FAILED);
    }
  });
}
