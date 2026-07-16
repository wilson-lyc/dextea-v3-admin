import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { employees, employeeRoles, roles } from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils';

export const employeeRepository = {
  async getEmployeeListWithPage(page: number, pageSize: number, keyword?: string) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    keyword = keyword?.trim();

    const baseQuery = db
      .select({
        id: employees.id,
        email: employees.email,
        displayName: employees.displayName,
        status: employees.status,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .orderBy(employees.id)
      .$dynamic();

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(employees);

    if (keyword) {
      const pattern = `%${keyword}%`;
      const filter = sql`(${employees.email} like ${pattern} or ${employees.displayName} like ${pattern})`;
      baseQuery.where(filter);
      countQuery.where(filter);
    }

    const [items, countResult] = await Promise.all([
      withPagination(baseQuery, page, pageSize),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  },

  async getEmployeeById(id: number) {
    const rows = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getEmployeeByEmail(email: string) {
    const rows = await db
      .select()
      .from(employees)
      .where(eq(employees.email, email))
      .limit(1);
    return rows[0] ?? null;
  },

  async createEmployee(data: { email: string; password: string; displayName: string; status: number }) {
    const result = await db.insert(employees).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateEmployeeById(id: number, email: string, displayName: string) {
    await db
      .update(employees)
      .set({ email, displayName })
      .where(eq(employees.id, id));
  },

  async updateEmployeeStatusById(id: number, status: number) {
    await db
      .update(employees)
      .set({ status })
      .where(eq(employees.id, id));
  },

  async updateEmployeePasswordById(id: number, password: string) {
    await db
      .update(employees)
      .set({ password })
      .where(eq(employees.id, id));
  },

  // ──── 员工-角色关联 ────

  /** 获取员工已绑定的角色 id 列表 */
  async getEmployeeRoleIds(employeeId: number): Promise<number[]> {
    const rows = await db
      .select({ roleId: employeeRoles.roleId })
      .from(employeeRoles)
      .where(eq(employeeRoles.employeeId, employeeId));
    return rows.map((r) => r.roleId);
  },

  /** 按 id 批量获取角色（id + name） */
  async getRolesByIds(ids: number[]) {
    if (ids.length === 0) return [];
    return db
      .select({ id: roles.id, name: roles.name })
      .from(roles)
      .where(inArray(roles.id, ids));
  },

  /** 校验给定 id 中真实存在的角色 id */
  async filterExistingRoleIds(ids: number[]): Promise<number[]> {
    if (ids.length === 0) return [];
    const rows = await db
      .select({ id: roles.id })
      .from(roles)
      .where(inArray(roles.id, ids));
    return rows.map((r) => r.id);
  },

  /** 全量覆盖员工角色（绑定 + 解绑一步到位） */
  async setEmployeeRoles(employeeId: number, roleIds: number[]) {
    await db.transaction(async (tx) => {
      await tx.delete(employeeRoles).where(eq(employeeRoles.employeeId, employeeId));
      if (roleIds.length > 0) {
        await tx
          .insert(employeeRoles)
          .values(roleIds.map((roleId) => ({ employeeId, roleId })));
      }
    });
  },
};
