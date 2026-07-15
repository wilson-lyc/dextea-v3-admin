import { and, desc, eq, like, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { storageLocationsTable } from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils';

export type StorageLocationRow = typeof storageLocationsTable.$inferSelect;

export const storageLocationRepository = {
  async getList(page: number, pageSize: number, keyword?: string) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    const conditions: ReturnType<typeof like>[] = [];
    if (keyword && keyword.trim()) {
      conditions.push(like(storageLocationsTable.name, `%${keyword.trim()}%`));
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const baseQuery = db
      .select()
      .from(storageLocationsTable)
      .where(where)
      .orderBy(desc(storageLocationsTable.id))
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(storageLocationsTable)
      .where(where);

    const [items, countResult] = await Promise.all([
      withPagination(baseQuery, page, pageSize),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return { items, total, page, pageSize };
  },

  async getById(id: number) {
    const rows = await db
      .select()
      .from(storageLocationsTable)
      .where(eq(storageLocationsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getOptions() {
    const rows = await db
      .select({
        id: storageLocationsTable.id,
        name: storageLocationsTable.name,
        status: storageLocationsTable.status,
      })
      .from(storageLocationsTable)
      .where(eq(storageLocationsTable.status, 1))
      .orderBy(desc(storageLocationsTable.id));
    return rows;
  },

  async create(data: typeof storageLocationsTable.$inferInsert) {
    const result = await db.insert(storageLocationsTable).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async update(id: number, data: Partial<typeof storageLocationsTable.$inferInsert>) {
    await db
      .update(storageLocationsTable)
      .set(data)
      .where(eq(storageLocationsTable.id, id));
  },

  async delete(id: number) {
    await db.delete(storageLocationsTable).where(eq(storageLocationsTable.id, id));
  },

  async nameExists(name: string, excludeId?: number) {
    const rows = await db
      .select({ id: storageLocationsTable.id })
      .from(storageLocationsTable)
      .where(eq(storageLocationsTable.name, name))
      .limit(1);
    if (rows.length === 0) return false;
    if (excludeId != null) return rows[0].id !== excludeId;
    return true;
  },
};
