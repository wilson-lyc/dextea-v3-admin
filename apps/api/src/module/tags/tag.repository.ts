import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { productTags, productTagMap, products } from '@/plugins/db/mysql/schema.js';

export const tagRepository = {
  async getTagOptions() {
    return db
      .select({
        label: productTags.name,
        value: sql<string>`cast(${productTags.id} as char)`,
      })
      .from(productTags)
      .orderBy(productTags.id);
  },

  async getTagList(page: number, pageSize: number) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (safePage - 1) * safePageSize;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productTags);

    const total = Number(countResult?.count ?? 0);

    const items = await db
      .select({
        id: productTags.id,
        name: productTags.name,
        boundCount: sql<number>`(select count(*) from ${productTagMap} where ${productTagMap.tagId} = ${productTags.id})`,
        createdAt: productTags.createdAt,
        updatedAt: productTags.updatedAt,
      })
      .from(productTags)
      .orderBy(productTags.id)
      .limit(safePageSize)
      .offset(offset);

    return { items, total, page: safePage, pageSize: safePageSize };
  },

  async getTagById(id: number) {
    const rows = await db
      .select()
      .from(productTags)
      .where(eq(productTags.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getTagByName(name: string) {
    const rows = await db
      .select()
      .from(productTags)
      .where(eq(productTags.name, name))
      .limit(1);
    return rows[0] ?? null;
  },

  async createTag(name: string) {
    const result = await db.insert(productTags).values({ name });
    return Number(result[0]?.insertId ?? 0);
  },

  async updateTagById(id: number, name: string) {
    await db
      .update(productTags)
      .set({ name })
      .where(eq(productTags.id, id));
  },

  async deleteTagById(id: number) {
    await db
      .delete(productTags)
      .where(eq(productTags.id, id));
  },

  async getTagProducts(tagId: number, page: number, pageSize: number) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (safePage - 1) * safePageSize;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productTagMap)
      .where(eq(productTagMap.tagId, tagId));

    const total = Number(countResult?.count ?? 0);

    const items = await db
      .select({
        id: products.id,
        name: products.name,
      })
      .from(productTagMap)
      .innerJoin(products, eq(productTagMap.productId, products.id))
      .where(eq(productTagMap.tagId, tagId))
      .orderBy(products.id)
      .limit(safePageSize)
      .offset(offset);

    return { items, total, page: safePage, pageSize: safePageSize };
  },

  async getExistingBindings(tagId: number, productIds: number[]) {
    return db
      .select({ productId: productTagMap.productId })
      .from(productTagMap)
      .where(
        and(
          eq(productTagMap.tagId, tagId),
          inArray(productTagMap.productId, productIds),
        ),
      );
  },

  async bindProducts(tagId: number, productIds: number[]) {
    await db.insert(productTagMap).values(
      productIds.map(productId => ({ productId, tagId })),
    );
  },

  async unbindProducts(tagId: number, productIds: number[]) {
    await db
      .delete(productTagMap)
      .where(
        and(
          eq(productTagMap.tagId, tagId),
          inArray(productTagMap.productId, productIds),
        ),
      );
  },

  async deleteTagProductRelations(tagId: number) {
    await db
      .delete(productTagMap)
      .where(eq(productTagMap.tagId, tagId));
  },

  async getExistingProductIds(productIds: number[]) {
    const rows = await db
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, productIds));
    return rows.map(r => r.id);
  },
};
