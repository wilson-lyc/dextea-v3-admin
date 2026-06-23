import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { usersTable } from '../db/schema.js';
import { verifyPassword } from '../utils/password.js';

const TOKEN_PREFIX = 'dextea:admin:token:';
const TOKEN_TTL = 60 * 30; // 30 minutes

export async function authRoutes(app: FastifyInstance) {
  app.post<{
    Body: { account: string; password: string };
  }>('/auth/login', async (request, reply) => {
    try {
      const { account, password } = request.body;

      if (!account || !password) {
        return reply.status(400).send({
          code: 1,
          data: null,
          message: '请输入账号和密码',
        });
      }

      const db = await getDb();

      // Find user by email (account is email)
      const users = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, account))
        .limit(1);

      const user = users[0];
      if (!user) {
        return reply.status(401).send({
          code: 1,
          data: null,
          message: '账号或密码错误',
        });
      }

      // Verify password
      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        return reply.status(401).send({
          code: 1,
          data: null,
          message: '账号或密码错误',
        });
      }

      // Check if user is active
      if (user.status === 0) {
        return reply.status(403).send({
          code: 1,
          data: null,
          message: '该账号已被禁用',
        });
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
      request.log.error(error);
      return reply.status(500).send({
        code: 1,
        data: null,
        message: '登录失败，请稍后重试',
      });
    }
  });

  // Logout — invalidate token
  app.post('/auth/logout', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        code: 1,
        data: null,
        message: '未提供有效的认证令牌',
      });
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
      request.log.error(error);
      return reply.status(500).send({
        code: 1,
        data: null,
        message: '退出登录失败',
      });
    }
  });
}
