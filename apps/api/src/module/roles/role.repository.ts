import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  roles,
  permissions,
  rolePermissions,
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
        id: roles.id,
        name: roles.name,
        note: roles.note,
        status: roles.status,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
      })
      .from(roles)
      .orderBy(roles.id)
      .$dynamic();

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(roles);

    if (keyword) {
      const pattern = `%${keyword}%`;
      const filter = sql`(${roles.name} like ${pattern})`;
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
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getRoleByName(name: string) {
    const rows = await db
      .select()
      .from(roles)
      .where(eq(roles.name, name))
      .limit(1);
    return rows[0] ?? null;
  },

  async createRole(data: { name: string; note?: string | null; status: number }) {
    const result = await db.insert(roles).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateRoleById(id: number, data: { name: string; note?: string | null }) {
    await db.update(roles).set(data).where(eq(roles.id, id));
  },

  async updateRoleStatusById(id: number, status: number) {
    await db.update(roles).set({ status }).where(eq(roles.id, id));
  },

  /** 获取启用状态的角色选项 */
  async getActiveRoleOptions() {
    return db
      .select({ id: roles.id, name: roles.name })
      .from(roles)
      .where(eq(roles.status, ROLE_STATUS.ACTIVE.value))
      .orderBy(roles.id);
  },

  /** 获取角色已绑定的权限 id 列表 */
  async getRolePermissionIds(roleId: number): Promise<number[]> {
    const rows = await db
      .select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    return rows.map((r) => r.permissionId);
  },

  /** 校验给定 id 中真实存在的权限 id */
  async filterExistingPermissionIds(ids: number[]): Promise<number[]> {
    if (ids.length === 0) return [];
    const rows = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.id, ids));
    return rows.map((r) => r.id);
  },

  /** 全量覆盖角色权限（绑定 + 解绑一步到位） */
  async setRolePermissions(roleId: number, permissionIds: number[]) {
    await db.transaction(async (tx) => {
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      if (permissionIds.length > 0) {
        await tx
          .insert(rolePermissions)
          .values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
      }
    });
  },
};
