import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '../db/index.js';
import { usersTable } from '../db/schema.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../errorcode/index.js';
import { userErrors } from '../errorcode/users.js';
import { parsePositiveInt, validateEmail, validateMaxLength, validateStatus } from '../utils/validation.js';
import type {
  ApiResponse,
  PaginatedData,
  User,
  UserQuery,
  CreateUserInput,
  CreateUserResponse,
  UpdateUserInput,
  UpdateUserResponse,
  ToggleUserStatusResponse,
} from '@dextea/shared-types';
import { USER_STATUS, USER_STATUS_VALUES } from '@dextea/shared-types';

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
  }, async (request, reply) => {
    try {
      const db = await getDb();
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const keyword = request.query.keyword?.trim();
      const offset = (page - 1) * pageSize;

      const baseQuery = db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          displayName: usersTable.displayName,
          status: usersTable.status,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
        })
        .from(usersTable);

      const countQuery = db.select({ count: sql<number>`count(*)` }).from(usersTable);

      if (keyword) {
        const pattern = `%${keyword}%`;
        const filter = sql`(${usersTable.email} like ${pattern} or ${usersTable.displayName} like ${pattern})`;
        baseQuery.where(filter);
        countQuery.where(filter);
      }

      const items = await baseQuery
        .limit(pageSize)
        .offset(offset)
        .orderBy(usersTable.id);

      const result = await countQuery;

      const total = Number(result[0]?.count ?? 0);

      return {
        code: 0,
        data: { items, total, page, pageSize },
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
    Body: CreateUserInput;
    Reply: ApiResponse<CreateUserResponse>;
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
  }, async (request, reply) => {
    try {
      const db = await getDb();
      const { email, displayName } = request.body;

      validateEmail(email);
      validateMaxLength(displayName, 255, '显示名称');


      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new AppError(userErrors.EMAIL_EXISTS);
      }

      // 生成随机密码（12位）
      const initialPassword = nanoid(12);
      const hashedPassword = await hashPassword(initialPassword);

      const result = await db.insert(usersTable).values({
        email,
        password: hashedPassword,
        displayName,
        status: USER_STATUS.DISABLED.value,
      });

      const insertId = Number(result[0]?.insertId ?? 0);

      return {
        code: 0,
        data: {
          user: {
            id: insertId,
            email,
            displayName,
            status: USER_STATUS.DISABLED.value,
          },
          initialPassword,
        },
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
    Body: UpdateUserInput;
    Reply: ApiResponse<UpdateUserResponse>;
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
  }, async (request, reply) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '用户ID');
      const { email, displayName, status } = request.body;

      validateEmail(email);
      validateMaxLength(displayName, 255, '显示名称');
      if (status !== undefined) {
        validateStatus(status, USER_STATUS_VALUES, '用户状态');
      }

      // Check if user exists
      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .limit(1);

      if (user.length === 0) {
        throw new AppError(userErrors.USER_NOT_FOUND);
      }

      // Check email uniqueness (excluding self)
      const existingEmail = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (existingEmail.length > 0 && existingEmail[0].id !== id) {
        throw new AppError(userErrors.EMAIL_EXISTS_OTHER);
      }

      await db
        .update(usersTable)
        .set({
          email,
          displayName,
          status,
        })
        .where(eq(usersTable.id, id));

      return {
        code: 0,
        data: {
          id,
          email,
          displayName,
          status,
        },
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
    Reply: ApiResponse<ToggleUserStatusResponse>;
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
  }, async (request, reply) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '用户ID');

      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .limit(1);

      if (user.length === 0) {
        throw new AppError(userErrors.USER_NOT_FOUND);
      }

      const newStatus = user[0].status === USER_STATUS.DISABLED.value ? USER_STATUS.ACTIVE.value : USER_STATUS.DISABLED.value;

      await db
        .update(usersTable)
        .set({ status: newStatus })
        .where(eq(usersTable.id, id));

      return {
        code: 0,
        data: { status: newStatus },
        message: newStatus === USER_STATUS.ACTIVE.value ? '已激活' : '已禁用',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(userErrors.OPERATE_FAILED);
    }
  });
}
