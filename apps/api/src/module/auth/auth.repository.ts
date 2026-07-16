import { and, eq } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  employees,
  employeeRoles,
  roles,
  rolePermissions,
  permissions,
} from '@/plugins/db/mysql/schema.js';
import { ROLE_STATUS } from '@dextea-admin/contracts';

export const authRepository = {
  async getEmployeeByEmail(email: string) {
    const rows = await db
      .select()
      .from(employees)
      .where(eq(employees.email, email))
      .limit(1);
    return rows[0] ?? null;
  },

  async getEmployeeById(id: number) {
    const rows = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getEmployeeStatusById(id: number): Promise<number | null> {
    const rows = await db
      .select({ status: employees.status })
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);
    return rows[0]?.status ?? null;
  },

  async updatePassword(id: number, hashedPassword: string) {
    await db
      .update(employees)
      .set({ password: hashedPassword })
      .where(eq(employees.id, id));
  },

  /** 获取员工「启用状态」角色的名称列表 */
  async getEmployeeRoleNames(employeeId: number): Promise<string[]> {
    const rows = await db
      .select({ name: roles.name })
      .from(employeeRoles)
      .innerJoin(roles, eq(employeeRoles.roleId, roles.id))
      .where(
        and(
          eq(employeeRoles.employeeId, employeeId),
          eq(roles.status, ROLE_STATUS.ACTIVE.value),
        ),
      );
    return rows.map((r) => r.name);
  },

  /** 获取员工「启用状态」角色所拥有的权限键（去重） */
  async getEmployeePermissionKeys(employeeId: number): Promise<string[]> {
    const rows = await db
      .selectDistinct({ key: permissions.key })
      .from(employeeRoles)
      .innerJoin(roles, eq(employeeRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(employeeRoles.employeeId, employeeId),
          eq(roles.status, ROLE_STATUS.ACTIVE.value),
        ),
      );
    return rows.map((r) => r.key);
  },
};
