import { and, desc, eq, like, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { galleryTable } from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils';

export const galleryRepository = {
  async getGalleryImageList(
    page: number,
    pageSize: number,
    filters: { keyword?: string } = {},
  ) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    const conditions: SQL[] = [];
    if (filters.keyword) {
      const kw = `%${filters.keyword}%`;
      conditions.push(or(like(galleryTable.name, kw), like(galleryTable.url, kw)));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = db
      .select({
        id: galleryTable.id,
        name: galleryTable.name,
        url: galleryTable.url,
        createdAt: galleryTable.createdAt,
      })
      .from(galleryTable)
      .where(where)
      .orderBy(desc(galleryTable.id))
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(galleryTable)
      .where(where);

    const [items, countResult] = await Promise.all([
      withPagination(baseQuery, page, pageSize),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  },

  async getGalleryImageById(id: number) {
    const rows = await db
      .select()
      .from(galleryTable)
      .where(eq(galleryTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async createGalleryImage(data: typeof galleryTable.$inferInsert) {
    const result = await db.insert(galleryTable).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async deleteGalleryImageById(id: number) {
    await db.delete(galleryTable).where(eq(galleryTable.id, id));
  },

  async updateGalleryImageNameById(id: number, name: string) {
    await db.update(galleryTable).set({ name }).where(eq(galleryTable.id, id));
  },
};
