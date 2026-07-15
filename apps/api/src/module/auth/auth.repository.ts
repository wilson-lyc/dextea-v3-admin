import { and, eq } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  employeesTable,
  employeeRolesTable,
  rolesTable,
  rolePermissionsTable,
  permissionsTable,
} from '@/plugins/db/mysql/schema.js';
import { ROLE_STATUS } from '@dextea-admin/contracts';

export const authRepository = {
  async getEmployeeByEmail(email: string) {
    const rows = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.email, email))
      .limit(1);
    return rows[0] ?? null;
  },

  async getEmployeeById(id: number) {
    const rows = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getEmployeeStatusById(id: number): Promise<number | null> {
    const rows = await db
      .select({ status: employeesTable.status })
      .from(employeesTable)
      .where(eq(employeesTable.id, id))
      .limit(1);
    return rows[0]?.status ?? null;
  },

  async updatePassword(id: number, hashedPassword: string) {
    await db
      .update(employeesTable)
      .set({ password: hashedPassword })
      .where(eq(employeesTable.id, id));
  },

  /** 获取员工「启用状态」角色的名称列表 */
  async getEmployeeRoleNames(employeeId: number): Promise<string[]> {
    const rows = await db
      .select({ name: rolesTable.name })
      .from(employeeRolesTable)
      .innerJoin(rolesTable, eq(employeeRolesTable.roleId, rolesTable.id))
      .where(
        and(
          eq(employeeRolesTable.employeeId, employeeId),
          eq(rolesTable.status, ROLE_STATUS.ACTIVE.value),
        ),
      );
    return rows.map((r) => r.name);
  },

  /** 获取员工「启用状态」角色所拥有的权限键（去重） */
  async getEmployeePermissionKeys(employeeId: number): Promise<string[]> {
    const rows = await db
      .selectDistinct({ key: permissionsTable.key })
      .from(employeeRolesTable)
      .innerJoin(rolesTable, eq(employeeRolesTable.roleId, rolesTable.id))
      .innerJoin(rolePermissionsTable, eq(rolePermissionsTable.roleId, rolesTable.id))
      .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionId, permissionsTable.id))
      .where(
        and(
          eq(employeeRolesTable.employeeId, employeeId),
          eq(rolesTable.status, ROLE_STATUS.ACTIVE.value),
        ),
      );
    return rows.map((r) => r.key);
  },
};
