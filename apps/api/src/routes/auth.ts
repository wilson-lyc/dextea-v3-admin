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
const TOKEN_TTL = 60 * 30; // 30 minutes

export async function authRoutes(app: FastifyInstance) {

  /** 
   * 获取当前用户信息
   * url：/api/v1/auth/me
   */
  app.get<{ Reply: ApiResponse<AuthMeResponse> }>('/auth/me', async (request, reply) => {
    const { userId, email, displayName } = request.authUser!;
    return {
      code: 0,
      data: {
        user: { id: userId, email, displayName },
      },
      message: 'ok',
    };
  });

  /**
   * 用户登录
   * url：/api/v1/auth/login
   */
  app.post<{
    Body: LoginRequest;
    Reply: ApiResponse<LoginResponse>;
  }>('/auth/login', async (request, reply) => {
    try {
      const { account, password } = request.body;

      validateRequired(account, '账号');
      validateRequired(password, '密码');
      validateEmail(account, '账号');
      validatePassword(password);

      const db = await getDb();

      // Find user by email (account is email)
      const users = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, account))
        .limit(1);

      const user = users[0];
      if (!user) {
        throw new AppError(authErrors.INVALID_CREDENTIALS);
      }

      // Verify password
      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        throw new AppError(authErrors.INVALID_CREDENTIALS);
      }

      // Check if user is active
      if (user.status === USER_STATUS.DISABLED.value) {
        throw new AppError(authErrors.ACCOUNT_DISABLED);
      }

      // Generate token and store in Redis
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

  /**
   * 用户退出
   * url：/api/v1/auth/logout
   */
  app.post<{ Reply: ApiResponse<null> }>('/auth/logout', async (request, reply) => {
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
