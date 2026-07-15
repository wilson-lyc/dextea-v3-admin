import { eq, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { galleryImagesTable, storageLocationsTable } from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils';

export const galleryRepository = {
  async getGalleryImageList(page: number, pageSize: number) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    const baseQuery = db
      .select({
        id: galleryImagesTable.id,
        url: galleryImagesTable.url,
        storageLocationId: galleryImagesTable.storageLocationId,
        storageLocationName: storageLocationsTable.name,
        createdAt: galleryImagesTable.createdAt,
      })
      .from(galleryImagesTable)
      .leftJoin(
        storageLocationsTable,
        eq(galleryImagesTable.storageLocationId, storageLocationsTable.id),
      )
      .orderBy(galleryImagesTable.id)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(galleryImagesTable);

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

  async getStorageLocationById(id: number) {
    const rows = await db
      .select()
      .from(storageLocationsTable)
      .where(eq(storageLocationsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  /** 取默认存储位置：第一个启用的存储位置（按 id 升序） */
  async getDefaultStorageLocation() {
    const rows = await db
      .select()
      .from(storageLocationsTable)
      .where(eq(storageLocationsTable.status, 1))
      .orderBy(storageLocationsTable.id)
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
