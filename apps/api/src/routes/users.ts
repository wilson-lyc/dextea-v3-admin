import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '../db/index.js';
import { usersTable } from '../db/schema.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../errorcode/index.js';
import { userErrors } from '../errorcode/users.js';
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
import { USER_STATUS } from '@dextea/shared-types';

export async function userRoutes(app: FastifyInstance) {
  /**
   * 用户列表
   * url：/api/v1/users
   */
  app.get<{
    Querystring: UserQuery;
    Reply: ApiResponse<PaginatedData<User>>;
  }>('/users', async (request, reply) => {
    try {
      const db = await getDb();
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;

      const items = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          displayName: usersTable.displayName,
          status: usersTable.status,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
        })
        .from(usersTable)
        .limit(pageSize)
        .offset(offset)
        .orderBy(usersTable.id);

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(usersTable);

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

  /**
   * 新增用户
   * url：/api/v1/users
   */
  app.post<{
    Body: CreateUserInput;
    Reply: ApiResponse<CreateUserResponse>;
  }>('/users', async (request, reply) => {
    try {
      const db = await getDb();
      const { email, displayName } = request.body;

      if (!email || !displayName) {
        throw new AppError(userErrors.MISSING_FIELDS);
      }

      // Check if email already exists
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new AppError(userErrors.EMAIL_EXISTS);
      }

      // Generate random password (12 characters)
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

  /**
   * 更新用户
   * url：/api/v1/users/:id
   */
  app.put<{
    Params: { id: string };
    Body: UpdateUserInput;
    Reply: ApiResponse<UpdateUserResponse>;
  }>('/users/:id', async (request, reply) => {
    try {
      const db = await getDb();
      const id = parseInt(request.params.id, 10);
      const { email, displayName, status } = request.body;

      if (!email || !displayName) {
        throw new AppError(userErrors.MISSING_FIELDS);
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

  /**
   * 启用/禁用用户
   * url：/api/v1/users/:id/status
   */
  app.patch<{
    Params: { id: string };
    Reply: ApiResponse<ToggleUserStatusResponse>;
  }>('/users/:id/status', async (request, reply) => {
    try {
      const db = await getDb();
      const id = parseInt(request.params.id, 10);

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
