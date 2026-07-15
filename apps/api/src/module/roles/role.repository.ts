import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  rolesTable,
  permissionsTable,
  rolePermissionsTable,
} from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils';
import { ROLE_STATUS } from '@dextea-admin/contracts';

export const roleRepository = {
  async getRoleList(page: number, pageSize: number, keyword?: string) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    keyword = keyword?.trim();

    const baseQuery = db
      .select({
        id: rolesTable.id,
        name: rolesTable.name,
        note: rolesTable.note,
        status: rolesTable.status,
        createdAt: rolesTable.createdAt,
        updatedAt: rolesTable.updatedAt,
      })
      .from(rolesTable)
      .orderBy(rolesTable.id)
      .$dynamic();

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(rolesTable);

    if (keyword) {
      const pattern = `%${keyword}%`;
      const filter = sql`(${rolesTable.name} like ${pattern})`;
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

  async getRoleById(id: number) {
    const rows = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getRoleByName(name: string) {
    const rows = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.name, name))
      .limit(1);
    return rows[0] ?? null;
  },

  async createRole(data: { name: string; note?: string | null; status: number }) {
    const result = await db.insert(rolesTable).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateRoleById(id: number, data: { name: string; note?: string | null }) {
    await db.update(rolesTable).set(data).where(eq(rolesTable.id, id));
  },

  async updateRoleStatusById(id: number, status: number) {
    await db.update(rolesTable).set({ status }).where(eq(rolesTable.id, id));
  },

  /** 获取启用状态的角色选项 */
  async getActiveRoleOptions() {
    return db
      .select({ id: rolesTable.id, name: rolesTable.name })
      .from(rolesTable)
      .where(eq(rolesTable.status, ROLE_STATUS.ACTIVE.value))
      .orderBy(rolesTable.id);
  },

  /** 获取角色已绑定的权限 id 列表 */
  async getRolePermissionIds(roleId: number): Promise<number[]> {
    const rows = await db
      .select({ permissionId: rolePermissionsTable.permissionId })
      .from(rolePermissionsTable)
      .where(eq(rolePermissionsTable.roleId, roleId));
    return rows.map((r) => r.permissionId);
  },

  /** 校验给定 id 中真实存在的权限 id */
  async filterExistingPermissionIds(ids: number[]): Promise<number[]> {
    if (ids.length === 0) return [];
    const rows = await db
      .select({ id: permissionsTable.id })
      .from(permissionsTable)
      .where(inArray(permissionsTable.id, ids));
    return rows.map((r) => r.id);
  },

  /** 全量覆盖角色权限（绑定 + 解绑一步到位） */
  async setRolePermissions(roleId: number, permissionIds: number[]) {
    await db.transaction(async (tx) => {
      await tx.delete(rolePermissionsTable).where(eq(rolePermissionsTable.roleId, roleId));
      if (permissionIds.length > 0) {
        await tx
          .insert(rolePermissionsTable)
          .values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
      }
    });
  },
};
