import { eq, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { galleryImagesTable } from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils';

export const galleryRepository = {
  async getGalleryImageList(page: number, pageSize: number, keyword?: string) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    keyword = keyword?.trim();

    const baseQuery = db
      .select()
      .from(galleryImagesTable)
      .orderBy(galleryImagesTable.id)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(galleryImagesTable);

    if (keyword) {
      const pattern = `%${keyword}%`;
      const filter = sql`(${galleryImagesTable.fileName} like ${pattern})`;
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
