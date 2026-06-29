import { randomUUID } from 'node:crypto';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';

type Db = MySql2Database<Record<string, unknown>>;
import { usersTable } from '../db/schema.js';
import { verifyPassword } from '../utils/password.js';
import { AppError } from '../errorcode/index.js';
import { authErrors } from '../errorcode/auth.js';
import { validateEmail, validatePassword } from '../utils/validation.js';
import { USER_STATUS } from '@dextea/shared-types';

const TOKEN_PREFIX = 'dextea:admin:token:';
const TOKEN_TTL = 60 * 30; // 30 分钟

interface RedisClient {
  setex(key: string, ttl: number, value: string): Promise<unknown>;
  del(key: string): Promise<unknown>;
}

interface LoginExtra {
  redisClient: RedisClient;
}

interface LogoutExtra {
  redisClient: RedisClient;
  authHeader?: string;
}

interface LoginResult {
  token: string;
  user: {
    id: number;
    email: string;
    displayName: string;
  };
}

/**
 * 用户登录
 * 输入：xxx
 * 输出：xxx
 */
export async function login(
  db: Db,
  account: string,
  password: string,
  extra: LoginExtra,
): Promise<LoginResult> {
  validateEmail(account, '账号');
  validatePassword(password);

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

  await extra.redisClient.setex(`${TOKEN_PREFIX}${token}`, TOKEN_TTL, sessionData);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
  };
}

/**
 * 退出登录
 *
 * 从请求头中提取 Bearer token 并从 Redis 中删除。
 */
export async function logout(extra: LogoutExtra): Promise<void> {
  const { authHeader, redisClient } = extra;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(authErrors.INVALID_TOKEN);
  }

  const token = authHeader.slice(7);
  await redisClient.del(`${TOKEN_PREFIX}${token}`);
}
