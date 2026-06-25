import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { configTable, usersTable } from '../db/schema.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../errorcode/index.js';
import { initErrors } from '../errorcode/init.js';
import { userErrors } from '../errorcode/users.js';
import { validateRequired, validateEmail, validatePassword, validateMaxLength } from '../utils/validation.js';
import type { ApiResponse, InitStatusData, InitRequest } from '@dextea/shared-types';

export async function initRoutes(app: FastifyInstance) {
  /** 初始化状态 */
  app.get<{ Reply: ApiResponse<InitStatusData> }>('/init/status', {
    schema: {
      description: '获取系统初始化状态',
      tags: ['System Init'],
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                initialized: { type: 'boolean' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (_request, _reply) => {
    try {
      const db = await getDb();
      const record = await db
        .select()
        .from(configTable)
        .where(eq(configTable.key, 'Initialized'))
        .limit(1);

      return { code: 0, data: { initialized: record.length > 0 }, message: 'ok' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(initErrors.INIT_FAILED);
    }
  });

  /** 系统初始化 */
  app.post<{ Body: InitRequest; Reply: ApiResponse<null> }>('/init', {
    schema: {
      description: '系统初始化（创建管理员账号）',
      tags: ['System Init'],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', minLength: 1, description: '管理员邮箱' },
          password: { type: 'string', minLength: 1, description: '密码' },
          displayName: { type: 'string', minLength: 1, description: '显示名称' },
        },
        required: ['email', 'password', 'displayName'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: { type: 'null' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const db = await getDb();

      const record = await db
        .select()
        .from(configTable)
        .where(eq(configTable.key, 'Initialized'))
        .limit(1);

      if (record.length > 0) {
        throw new AppError(initErrors.ALREADY_INITIALIZED);
      }

      const { email, password, displayName } = request.body;

      validateEmail(email);
      validatePassword(password);
      validateMaxLength(displayName, 255, '显示名称');

      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new AppError(initErrors.EMAIL_EXISTS);
      }

      const hashedPassword = await hashPassword(password);
      await db.insert(usersTable).values({
        email,
        password: hashedPassword,
        displayName,
      });

      await db.insert(configTable).values({
        key: 'Initialized',
        value: 'true',
        note: '系统初始化标记',
      });

      return { code: 0, data: null, message: '初始化成功' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(initErrors.INIT_FAILED);
    }
  });
}
