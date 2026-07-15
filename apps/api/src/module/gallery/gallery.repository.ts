import { and, desc, eq, like, sql, type SQL } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { galleryImagesTable } from '@/plugins/db/mysql/schema.js';
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
      conditions.push(like(galleryImagesTable.url, `%${filters.keyword}%`));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = db
      .select({
        id: galleryImagesTable.id,
        url: galleryImagesTable.url,
        createdAt: galleryImagesTable.createdAt,
      })
      .from(galleryImagesTable)
      .where(where)
      .orderBy(desc(galleryImagesTable.id))
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(galleryImagesTable)
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
      .from(galleryImagesTable)
      .where(eq(galleryImagesTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async createGalleryImage(data: typeof galleryImagesTable.$inferInsert) {
    const result = await db.insert(galleryImagesTable).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async deleteGalleryImageById(id: number) {
    await db.delete(galleryImagesTable).where(eq(galleryImagesTable.id, id));
  },
};
