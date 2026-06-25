import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { usersTable } from '../db/schema.js';
import { verifyPassword } from '../utils/password.js';
import { AppError } from '../errorcode/index.js';
import { authErrors } from '../errorcode/auth.js';
import { validateRequired, validateEmail, validatePassword } from '../utils/validation.js';
import { USER_STATUS } from '@dextea/shared-types';
import type { ApiResponse, AuthMeResponse, LoginRequest, LoginResponse } from '@dextea/shared-types';

const TOKEN_PREFIX = 'dextea:admin:token:';
const TOKEN_TTL = 60 * 30; // 30 分钟

export async function authRoutes(app: FastifyInstance) {

  /** 获取当前用户信息 */
  app.get<{ Reply: ApiResponse<AuthMeResponse> }>('/auth/me', {
    schema: {
      description: '获取当前登录用户信息',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
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
                  },
                },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { userId, email, displayName } = request.authUser!;
    return {
      code: 0,
      data: {
        user: { id: userId, email, displayName },
      },
      message: 'ok',
    };
  });

  /** 用户登录 */
  app.post<{
    Body: LoginRequest;
    Reply: ApiResponse<LoginResponse>;
  }>('/auth/login', {
    schema: {
      description: '用户登录',
      tags: ['Auth'],
      body: {
        type: 'object',
        properties: {
          account: { type: 'string', minLength: 1, description: '账号（邮箱）' },
          password: { type: 'string', minLength: 1, description: '密码' },
        },
        required: ['account', 'password'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    email: { type: 'string' },
                    displayName: { type: 'string' },
                  },
                },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { account, password } = request.body;

      validateEmail(account, '账号');
      validatePassword(password);

      const db = await getDb();

      const users = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, account))
        .limit(1);

      const user = users[0];
      if (!user) {
        throw new AppError(authErrors.INVALID_CREDENTIALS);
      }

      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        throw new AppError(authErrors.INVALID_CREDENTIALS);
      }

      if (user.status === USER_STATUS.DISABLED.value) {
        throw new AppError(authErrors.ACCOUNT_DISABLED);
      }

      const token = randomUUID();
      const sessionData = JSON.stringify({
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
      });

      await app.redis.setex(`${TOKEN_PREFIX}${token}`, TOKEN_TTL, sessionData);

      return {
        code: 0,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
          },
        },
        message: '登录成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(authErrors.LOGIN_FAILED);
    }
  });

  /** 用户退出 */
  app.post<{ Reply: ApiResponse<null> }>('/auth/logout', {
    schema: {
      description: '用户退出登录',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
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
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(authErrors.INVALID_TOKEN);
    }

    try {
      const token = authHeader.slice(7);
      await app.redis.del(`${TOKEN_PREFIX}${token}`);

      return {
        code: 0,
        data: null,
        message: '已退出登录',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(authErrors.LOGOUT_FAILED);
    }
  });
}
