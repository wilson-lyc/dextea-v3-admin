import type { FastifyInstance } from 'fastify';
import { getDb } from '../plugins/db/mysql/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { AuthErrorCodes } from '@/module/auth/auth.errorcode.js';
import { validateRequired } from '../utils/validation.js';
import { login, logout } from '../services/auth.service.js';
import type { ApiResponse, AuthMeResponse, LoginRequest, LoginResponse } from '@dextea/shared-types';

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
    const { userId, email, displayName } = request.authEmployee!;
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
      const db = await getDb();
      const result = await login(db, account, password, { redisClient: app.redis });

      return {
        code: 0,
        data: result,
        message: '登录成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(AuthErrorCodes.LOGIN_FAILED);
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
    try {
      const authHeader = request.headers.authorization;
      await logout({ redisClient: app.redis, authHeader });

      return {
        code: 0,
        data: null,
        message: '已退出登录',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(AuthErrorCodes.LOGOUT_FAILED);
    }
  });
}
