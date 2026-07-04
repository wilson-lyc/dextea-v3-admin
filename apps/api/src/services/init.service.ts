import type { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { configTable, employeesTable } from '../db/schema.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../errorcode/index.js';
import { initErrors } from '../errorcode/init.js';
import { validateEmail, validatePassword, validateMaxLength } from '../utils/validation.js';
import type { InitStatusData, InitRequest } from '@dextea/shared-types';

/**
 * 获取系统初始化状态
 *
 * 查询配置表中是否存在 'Initialized' 记录。
 */
export async function getInitStatus(
  db: MySql2Database<Record<string, unknown>>,
): Promise<InitStatusData> {
  const record = await db
    .select()
    .from(configTable)
    .where(eq(configTable.key, 'Initialized'))
    .limit(1);

  return { initialized: record.length > 0 };
}

/**
 * 系统初始化
 *
 * 创建管理员账号并写入初始化标记。
 * 校验邮箱/密码格式、邮箱唯一性，以及是否已初始化。
 */
export async function initialize(
  db: MySql2Database<Record<string, unknown>>,
  input: InitRequest,
): Promise<void> {
  const initialized = await db
    .select()
    .from(configTable)
    .where(eq(configTable.key, 'Initialized'))
    .limit(1);

  if (initialized.length > 0) {
    throw new AppError(initErrors.ALREADY_INITIALIZED);
  }

  const { email, password, displayName } = input;

  validateEmail(email);
  validatePassword(password);
  validateMaxLength(displayName, 255, '显示名称');

  const existingEmployee = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.email, email))
    .limit(1);

  if (existingEmployee.length > 0) {
    throw new AppError(initErrors.EMAIL_EXISTS);
  }

  const hashedPassword = await hashPassword(password);
  await db.insert(employeesTable).values({
    email,
    password: hashedPassword,
    displayName,
    status: 1,
  });

  await db.insert(configTable).values({
    key: 'Initialized',
    value: 'true',
    note: '系统初始化标记',
  });
}
