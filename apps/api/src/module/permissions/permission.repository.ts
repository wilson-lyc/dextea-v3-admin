import { inArray, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { permissionsTable } from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils';

export const permissionRepository = {
  async getPermissionList(page: number, pageSize: number, keyword?: string) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    keyword = keyword?.trim();

    const baseQuery = db
      .select({
        id: permissionsTable.id,
        key: permissionsTable.key,
        name: permissionsTable.name,
        note: permissionsTable.note,
        createdAt: permissionsTable.createdAt,
        updatedAt: permissionsTable.updatedAt,
      })
      .from(permissionsTable)
      .orderBy(permissionsTable.key)
      .$dynamic();

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(permissionsTable);

    if (keyword) {
      const pattern = `%${keyword}%`;
      const filter = sql`(${permissionsTable.key} like ${pattern} or ${permissionsTable.name} like ${pattern})`;
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
        id: permissionsTable.id,
        key: permissionsTable.key,
        name: permissionsTable.name,
      })
      .from(permissionsTable)
      .orderBy(permissionsTable.key);
  },

  async getPermissionsByIds(ids: number[]) {
    if (ids.length === 0) return [];
    return db
      .select({
        id: permissionsTable.id,
        key: permissionsTable.key,
        name: permissionsTable.name,
      })
      .from(permissionsTable)
      .where(inArray(permissionsTable.id, ids));
  },
};
