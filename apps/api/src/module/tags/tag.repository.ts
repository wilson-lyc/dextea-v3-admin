import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { productTagsTable, productTagMapTable, productsTable } from '@/plugins/db/mysql/schema.js';

export const tagRepository = {
  async getTagOptions() {
    return db
      .select({
        label: productTagsTable.name,
        value: sql<string>`cast(${productTagsTable.id} as char)`,
      })
      .from(productTagsTable)
      .orderBy(productTagsTable.id);
  },

  async getTagList(page: number, pageSize: number) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (safePage - 1) * safePageSize;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productTagsTable);

    const total = Number(countResult?.count ?? 0);

    const items = await db
      .select({
        id: productTagsTable.id,
        name: productTagsTable.name,
        boundCount: sql<number>`(select count(*) from ${productTagMapTable} where ${productTagMapTable.tagId} = ${productTagsTable.id})`,
        createdAt: productTagsTable.createdAt,
        updatedAt: productTagsTable.updatedAt,
      })
      .from(productTagsTable)
      .orderBy(productTagsTable.id)
      .limit(safePageSize)
      .offset(offset);

    return { items, total, page: safePage, pageSize: safePageSize };
  },

  async getTagById(id: number) {
    const rows = await db
      .select()
      .from(productTagsTable)
      .where(eq(productTagsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getTagByName(name: string) {
    const rows = await db
      .select()
      .from(productTagsTable)
      .where(eq(productTagsTable.name, name))
      .limit(1);
    return rows[0] ?? null;
  },

  async createTag(name: string) {
    const result = await db.insert(productTagsTable).values({ name });
    return Number(result[0]?.insertId ?? 0);
  },

  async updateTagById(id: number, name: string) {
    await db
      .update(productTagsTable)
      .set({ name })
      .where(eq(productTagsTable.id, id));
  },

  async deleteTagById(id: number) {
    await db
      .delete(productTagsTable)
      .where(eq(productTagsTable.id, id));
  },

  async getTagProducts(tagId: number, page: number, pageSize: number) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (safePage - 1) * safePageSize;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productTagMapTable)
      .where(eq(productTagMapTable.tagId, tagId));

    const total = Number(countResult?.count ?? 0);

    const items = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
      })
      .from(productTagMapTable)
      .innerJoin(productsTable, eq(productTagMapTable.productId, productsTable.id))
      .where(eq(productTagMapTable.tagId, tagId))
      .orderBy(productsTable.id)
      .limit(safePageSize)
      .offset(offset);

    return { items, total, page: safePage, pageSize: safePageSize };
  },

  async getExistingBindings(tagId: number, productIds: number[]) {
    return db
      .select({ productId: productTagMapTable.productId })
      .from(productTagMapTable)
      .where(
        and(
          eq(productTagMapTable.tagId, tagId),
          inArray(productTagMapTable.productId, productIds),
        ),
      );
  },

  async bindProducts(tagId: number, productIds: number[]) {
    await db.insert(productTagMapTable).values(
      productIds.map(productId => ({ productId, tagId })),
    );
  },

  async unbindProducts(tagId: number, productIds: number[]) {
    await db
      .delete(productTagMapTable)
      .where(
        and(
          eq(productTagMapTable.tagId, tagId),
          inArray(productTagMapTable.productId, productIds),
        ),
      );
  },

  async deleteTagProductRelations(tagId: number) {
    await db
      .delete(productTagMapTable)
      .where(eq(productTagMapTable.tagId, tagId));
  },

  async getExistingProductIds(productIds: number[]) {
    const rows = await db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(inArray(productsTable.id, productIds));
    return rows.map(r => r.id);
  },
};
