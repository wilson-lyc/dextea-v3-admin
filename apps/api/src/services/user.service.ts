import type { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, sql } from 'drizzle-orm';

type Db = MySql2Database<Record<string, unknown>>;
import { nanoid } from 'nanoid';
import { usersTable } from '../db/schema.js';
import { AppError } from '../errorcode/index.js';
import { userErrors } from '../errorcode/users.js';
import { validateEmail, validateMaxLength, validateStatus } from '../utils/validation.js';
import { hashPassword } from '../utils/password.js';
import type { PaginatedData, User, CreateUserInput, UpdateUserInput } from '@dextea/shared-types';
import { USER_STATUS, USER_STATUS_VALUES } from '@dextea/shared-types';

/**
 * 获取用户列表（分页 + 关键词搜索）
 */
export async function listUsers(
  db: Db,
  params: { page: number; pageSize: number; keyword?: string },
): Promise<PaginatedData<User>> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const keyword = params.keyword?.trim();
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

  const [items, countResult] = await Promise.all([
    baseQuery.limit(pageSize).offset(offset).orderBy(usersTable.id),
    countQuery,
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return { items, total, page, pageSize };
}

/**
 * 创建用户
 *
 * 自动生成 12 位随机初始密码（argon2 加密后入库），用户默认禁用。
 */
export async function createUser(
  db: Db,
  input: CreateUserInput,
): Promise<{ user: { id: number; email: string; displayName: string; status: number }; initialPassword: string }> {
  const { email, displayName } = input;

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
    user: {
      id: insertId,
      email,
      displayName,
      status: USER_STATUS.DISABLED.value,
    },
    initialPassword,
  };
}

/**
 * 更新用户信息
 *
 * 同时校验邮箱唯一性（排除自身）、状态值合法性。
 */
export async function updateUser(
  db: Db,
  id: number,
  input: UpdateUserInput,
): Promise<{ id: number; email: string; displayName: string; status: number }> {
  const { email, displayName, status } = input;

  validateEmail(email);
  validateMaxLength(displayName, 255, '显示名称');
  validateStatus(status, USER_STATUS_VALUES, '用户状态');

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (user.length === 0) {
    throw new AppError(userErrors.USER_NOT_FOUND);
  }

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
    .set({ email, displayName, status })
    .where(eq(usersTable.id, id));

  return { id, email, displayName, status };
}

/**
 * 启用/禁用用户（状态翻转）
 *
 * 当前状态为禁用 → 激活，当前状态为激活 → 禁用。
 */
export async function toggleUserStatus(
  db: Db,
  id: number,
): Promise<{ status: number }> {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (user.length === 0) {
    throw new AppError(userErrors.USER_NOT_FOUND);
  }

  const newStatus = user[0].status === USER_STATUS.DISABLED.value
    ? USER_STATUS.ACTIVE.value
    : USER_STATUS.DISABLED.value;

  await db
    .update(usersTable)
    .set({ status: newStatus })
    .where(eq(usersTable.id, id));

  return { status: newStatus };
}
