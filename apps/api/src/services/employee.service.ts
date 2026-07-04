import type { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, sql } from 'drizzle-orm';

type Db = MySql2Database<Record<string, unknown>>;
import { nanoid } from 'nanoid';
import { withPagination } from '../utils/pagination.js';
import { employeesTable } from '../db/schema.js';
import { AppError } from '../errorcode/index.js';
import { employeeErrors } from '../errorcode/employees.js';
import { validateEmail, validateMaxLength } from '../utils/validation.js';
import { hashPassword } from '../utils/password.js';
import type { PaginatedData, Employee, CreateEmployeeInput, UpdateEmployeeInput } from '@dextea/shared-types';
import { EMPLOYEE_STATUS } from '@dextea/shared-types';

/**
 * 获取员工列表
 * 支持分页查询和关键词搜索
 */
export async function listEmployees(
  db: Db,
  params: { page: number; pageSize: number; keyword?: string },
): Promise<PaginatedData<Employee>> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const keyword = params.keyword?.trim();

  const baseQuery = db
    .select({
      id: employeesTable.id,
      email: employeesTable.email,
      displayName: employeesTable.displayName,
      status: employeesTable.status,
      createdAt: employeesTable.createdAt,
      updatedAt: employeesTable.updatedAt,
    })
    .from(employeesTable)
    .orderBy(employeesTable.id)
    .$dynamic();

  const countQuery = db.select({ count: sql<number>`count(*)` }).from(employeesTable);

  if (keyword) {
    const pattern = `%${keyword}%`;
    const filter = sql`(${employeesTable.email} like ${pattern} or ${employeesTable.displayName} like ${pattern})`;
    baseQuery.where(filter);
    countQuery.where(filter);
  }

  const [items, countResult] = await Promise.all([
    withPagination(baseQuery, page, pageSize),
    countQuery,
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return { items, total, page, pageSize };
}

/**
 * 创建员工
 * 自动生成 12 位随机初始密码，并经 argon2 加密后入库。员工默认禁用。
 */
export async function createEmployee(
  db: Db,
  input: CreateEmployeeInput,
): Promise<{ user: { id: number; email: string; displayName: string; status: number }; initialPassword: string }> {
  const { email, displayName } = input;

  validateEmail(email);
  validateMaxLength(displayName, 255, '显示名称');

  const existingEmployee = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.email, email))
    .limit(1);

  if (existingEmployee.length > 0) {
    throw new AppError(employeeErrors.EMAIL_EXISTS);
  }

  const initialPassword = nanoid(12);
  const hashedPassword = await hashPassword(initialPassword);

  const result = await db.insert(employeesTable).values({
    email,
    password: hashedPassword,
    displayName,
    status: EMPLOYEE_STATUS.DISABLED.value,
  });

  const insertId = Number(result[0]?.insertId ?? 0);

  return {
    user: {
      id: insertId,
      email,
      displayName,
      status: EMPLOYEE_STATUS.DISABLED.value,
    },
    initialPassword,
  };
}

/**
 * 更新员工基础信息
 * 同时校验邮箱唯一性（排除自身）、状态值合法性。
 */
export async function updateEmployee(
  db: Db,
  id: number,
  input: UpdateEmployeeInput,
): Promise<{ id: number; email: string; displayName: string }> {
  const { email, displayName } = input;

  validateEmail(email);
  validateMaxLength(displayName, 255, '显示名称');

  const employee = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.id, id))
    .limit(1);

  if (employee.length === 0) {
    throw new AppError(employeeErrors.EMPLOYEE_NOT_FOUND);
  }

  const existingEmail = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.email, email))
    .limit(1);

  if (existingEmail.length > 0 && existingEmail[0].id !== id) {
    throw new AppError(employeeErrors.EMAIL_EXISTS_OTHER);
  }

  await db
    .update(employeesTable)
    .set({ email, displayName })
    .where(eq(employeesTable.id, id));

  return { id, email, displayName };
}

/**
 * 启用/禁用员工
 * 当前状态为禁用 → 激活，当前状态为激活 → 禁用。
 */
export async function toggleEmployeeStatus(
  db: Db,
  id: number,
): Promise<{ email: string; status: number }> {
  const employee = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.id, id))
    .limit(1);

  if (employee.length === 0) {
    throw new AppError(employeeErrors.EMPLOYEE_NOT_FOUND);
  }

  const newStatus = employee[0].status === EMPLOYEE_STATUS.DISABLED.value
    ? EMPLOYEE_STATUS.ACTIVE.value
    : EMPLOYEE_STATUS.DISABLED.value;

  await db
    .update(employeesTable)
    .set({ status: newStatus })
    .where(eq(employeesTable.id, id));

  return { email: employee[0].email, status: newStatus };
}
