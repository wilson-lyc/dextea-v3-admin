import { and, desc, eq, like, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { gallery } from '@/plugins/db/mysql/schema.js';
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
      const cond = or(like(gallery.name, kw), like(gallery.url, kw));
      if (cond) conditions.push(cond);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = db
      .select({
        id: gallery.id,
        name: gallery.name,
        url: gallery.url,
        createdAt: gallery.createdAt,
      })
      .from(gallery)
      .where(where)
      .orderBy(desc(gallery.id))
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(gallery)
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
      .from(gallery)
      .where(eq(gallery.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async createGalleryImage(data: typeof gallery.$inferInsert) {
    const result = await db.insert(gallery).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async deleteGalleryImageById(id: number) {
    await db.delete(gallery).where(eq(gallery.id, id));
  },

  async updateGalleryImageNameById(id: number, name: string) {
    await db.update(gallery).set({ name }).where(eq(gallery.id, id));
  },
};
