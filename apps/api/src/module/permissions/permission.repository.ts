import { inArray, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { permissions } from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils';

export const permissionRepository = {
  async getPermissionList(page: number, pageSize: number, keyword?: string) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    keyword = keyword?.trim();

    const baseQuery = db
      .select({
        id: permissions.id,
        key: permissions.key,
        name: permissions.name,
        note: permissions.note,
        createdAt: permissions.createdAt,
        updatedAt: permissions.updatedAt,
      })
      .from(permissions)
      .orderBy(permissions.key)
      .$dynamic();

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(permissions);

    if (keyword) {
      const pattern = `%${keyword}%`;
      const filter = sql`(${permissions.key} like ${pattern} or ${permissions.name} like ${pattern})`;
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

  async getAllPermissionOptions() {
    return db
      .select({
        id: permissions.id,
        key: permissions.key,
        name: permissions.name,
      })
      .from(permissions)
      .orderBy(permissions.key);
  },

  async getPermissionsByIds(ids: number[]) {
    if (ids.length === 0) return [];
    return db
      .select({
        id: permissions.id,
        key: permissions.key,
        name: permissions.name,
      })
      .from(permissions)
      .where(inArray(permissions.id, ids));
  },
};
