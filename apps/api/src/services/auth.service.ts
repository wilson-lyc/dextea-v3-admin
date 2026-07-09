import { randomUUID } from 'node:crypto';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';

type Db = MySql2Database<Record<string, unknown>>;
import { employeesTable } from '../plugins/db/mysql/schema.js';
import { verifyPassword } from '../plugins/utils/password.js';
import { BizError } from '@/common/exceptions/index.js';
import { AuthErrorCodes } from '@/module/auth/auth.errorcode.js';
import { validateEmail, validatePassword } from '../plugins/utils/validation.js';
import { EMPLOYEE_STATUS } from '@dextea/shared-types';

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

  const employees = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.email, account))
    .limit(1);

  const employee = employees[0];
  if (!employee) {
    throw new BizError(AuthErrorCodes.INVALID_CREDENTIALS, undefined, 401);
  }

  const valid = await verifyPassword(password, employee.password);
  if (!valid) {
    throw new BizError(AuthErrorCodes.INVALID_CREDENTIALS, undefined, 401);
  }

  if (employee.status === EMPLOYEE_STATUS.DISABLED.value) {
    throw new BizError(AuthErrorCodes.ACCOUNT_DISABLED, undefined, 401);
  }

  const token = randomUUID();
  const sessionData = JSON.stringify({
    userId: employee.id,
    email: employee.email,
    displayName: employee.displayName,
  });

  await extra.redisClient.setex(`${TOKEN_PREFIX}${token}`, TOKEN_TTL, sessionData);

  return {
    token,
    user: {
      id: employee.id,
      email: employee.email,
      displayName: employee.displayName,
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
    throw new BizError(AuthErrorCodes.INVALID_TOKEN, undefined, 401);
  }

  const token = authHeader.slice(7);
  await redisClient.del(`${TOKEN_PREFIX}${token}`);
}
