import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  productsTable,
  productTagsTable,
  productTagMapTable,
  productIngredientsTable,
  ingredientsTable,
} from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils';

export const productRepository = {
  // ─── 商品列表 ─────────────────────────────────────

  async getProductListWithPage(
    page: number,
    pageSize: number,
    keyword?: string,
    status?: number,
    priceMin?: number,
    priceMax?: number,
    tagIds?: number[],
  ) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    const baseQuery = db
      .select()
      .from(productsTable)
      .orderBy(productsTable.id)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(productsTable)
      .$dynamic();

    if (keyword?.trim()) {
      const pattern = `%${keyword.trim()}%`;
      const filter = sql`${productsTable.name} like ${pattern}`;
      baseQuery.where(filter);
      countQuery.where(filter);
    }

    if (status !== undefined) {
      baseQuery.where(eq(productsTable.status, status));
      countQuery.where(eq(productsTable.status, status));
    }

    if (priceMin !== undefined && priceMin >= 0) {
      baseQuery.where(sql`${productsTable.price} >= ${priceMin}`);
      countQuery.where(sql`${productsTable.price} >= ${priceMin}`);
    }

    if (priceMax !== undefined && priceMax >= 0) {
      baseQuery.where(sql`${productsTable.price} <= ${priceMax}`);
      countQuery.where(sql`${productsTable.price} <= ${priceMax}`);
    }

    // 标签筛选：查找同时拥有所有指定标签的商品
    if (tagIds && tagIds.length > 0) {
      const matchingProductIds = await db
        .select({ productId: productTagMapTable.productId })
        .from(productTagMapTable)
        .where(inArray(productTagMapTable.tagId, tagIds))
        .groupBy(productTagMapTable.productId)
        .having(sql`count(distinct ${productTagMapTable.tagId}) = ${tagIds.length}`);

      const productIdSet = matchingProductIds.map(r => r.productId);
      if (productIdSet.length > 0) {
        baseQuery.where(inArray(productsTable.id, productIdSet));
        countQuery.where(inArray(productsTable.id, productIdSet));
      } else {
        baseQuery.where(sql`1 = 0`);
        countQuery.where(sql`1 = 0`);
      }
    }

    const [items, countResult] = await Promise.all([
      withPagination(baseQuery, page, pageSize),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    // 批量获取标签并挂载
    if (items.length > 0) {
      const productIds = items.map(p => p.id);
      const tagRelations = await db
        .select({
          productId: productTagMapTable.productId,
          tagId: productTagsTable.id,
          tagName: productTagsTable.name,
        })
        .from(productTagMapTable)
        .innerJoin(productTagsTable, eq(productTagMapTable.tagId, productTagsTable.id))
        .where(inArray(productTagMapTable.productId, productIds));

      const tagsByProductId = new Map<number, { id: number; name: string }[]>();
      for (const rel of tagRelations) {
        if (!tagsByProductId.has(rel.productId)) {
          tagsByProductId.set(rel.productId, []);
        }
        tagsByProductId.get(rel.productId)!.push({ id: rel.tagId, name: rel.tagName });
      }

      const itemsWithTags = items.map(item => ({
        ...item,
        tags: tagsByProductId.get(item.id) ?? [],
      }));
      return { items: itemsWithTags, total, page, pageSize };
    }

    return { items, total, page, pageSize };
  },

  // ─── 商品基础信息 ─────────────────────────────────

  async getProductById(id: number) {
    const rows = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getProductTagsById(id: number) {
    const relations = await db
      .select({
        id: productTagsTable.id,
        name: productTagsTable.name,
      })
      .from(productTagMapTable)
      .innerJoin(productTagsTable, eq(productTagMapTable.tagId, productTagsTable.id))
      .where(eq(productTagMapTable.productId, id))
      .orderBy(productTagsTable.id);

    return relations;
  },

  // ─── 新增商品 ─────────────────────────────────────

  async createProduct(data: typeof productsTable.$inferInsert) {
    const result = await db.insert(productsTable).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  // ─── 更新商品 ─────────────────────────────────────

  async updateProductById(id: number, data: Partial<typeof productsTable.$inferInsert>) {
    await db
      .update(productsTable)
      .set(data)
      .where(eq(productsTable.id, id));
  },

  // ─── 商品标签列表（分页） ─────────────────────────

  async getProductTagListWithPage(productId: number, page: number, pageSize: number) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (page - 1) * pageSize;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productTagMapTable)
      .where(eq(productTagMapTable.productId, productId));

    const total = Number(countResult?.count ?? 0);

    const tags = await db
      .select({
        id: productTagsTable.id,
        name: productTagsTable.name,
      })
      .from(productTagMapTable)
      .innerJoin(productTagsTable, eq(productTagMapTable.tagId, productTagsTable.id))
      .where(eq(productTagMapTable.productId, productId))
      .orderBy(productTagsTable.id)
      .limit(pageSize)
      .offset(offset);

    return { items: tags, total, page, pageSize };
  },

  // ─── 商品-标签关联 ────────────────────────────────

  async insertProductTagRelations(
    relations: { productId: number; tagId: number }[],
  ) {
    if (relations.length === 0) return;
    await db.insert(productTagMapTable).values(relations);
  },

  async deleteProductTagRelations(productId: number, tagIds: number[]) {
    await db
      .delete(productTagMapTable)
      .where(
        and(
          eq(productTagMapTable.productId, productId),
          inArray(productTagMapTable.tagId, tagIds),
        ),
      );
  },

  // ─── 商品原料列表（分页） ─────────────────────────

  async getProductIngredientListWithPage(productId: number, page: number, pageSize: number) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (page - 1) * pageSize;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productIngredientsTable)
      .where(eq(productIngredientsTable.productId, productId));

    const total = Number(countResult?.count ?? 0);

    const rows = await db
      .select({
        ingredientId: productIngredientsTable.ingredientId,
        ingredientName: ingredientsTable.name,
        unit: ingredientsTable.unit,
        quantity: productIngredientsTable.quantity,
        sort: productIngredientsTable.sort,
      })
      .from(productIngredientsTable)
      .innerJoin(ingredientsTable, eq(productIngredientsTable.ingredientId, ingredientsTable.id))
      .where(eq(productIngredientsTable.productId, productId))
      .orderBy(productIngredientsTable.sort, productIngredientsTable.ingredientId)
      .limit(pageSize)
      .offset(offset);

    return { items: rows, total, page, pageSize };
  },

  // ─── 商品-原料关联 ────────────────────────────────

  async getProductIngredientRelation(productId: number, ingredientId: number) {
    const rows = await db
      .select()
      .from(productIngredientsTable)
      .where(
        and(
          eq(productIngredientsTable.productId, productId),
          eq(productIngredientsTable.ingredientId, ingredientId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async insertProductIngredientRelation(data: {
    productId: number;
    ingredientId: number;
    quantity: number;
    sort: number;
  }) {
    await db.insert(productIngredientsTable).values(data);
  },

  async updateProductIngredientQuantity(
    productId: number,
    ingredientId: number,
    quantity: number,
  ) {
    await db
      .update(productIngredientsTable)
      .set({ quantity })
      .where(
        and(
          eq(productIngredientsTable.productId, productId),
          eq(productIngredientsTable.ingredientId, ingredientId),
        ),
      );
  },

  async updateProductIngredientSort(
    productId: number,
    ingredientId: number,
    sort: number,
  ) {
    await db
      .update(productIngredientsTable)
      .set({ sort })
      .where(
        and(
          eq(productIngredientsTable.productId, productId),
          eq(productIngredientsTable.ingredientId, ingredientId),
        ),
      );
  },

  async deleteProductIngredientRelation(productId: number, ingredientId: number) {
    await db
      .delete(productIngredientsTable)
      .where(
        and(
          eq(productIngredientsTable.productId, productId),
          eq(productIngredientsTable.ingredientId, ingredientId),
        ),
      );
  },

  // ─── 商品选项列表 ─────────────────────────────────

  async getProductOptionSelectList() {
    return db
      .select({
        label: productsTable.name,
        value: sql<string>`cast(${productsTable.id} as char)`,
      })
      .from(productsTable)
      .orderBy(productsTable.id);
  },

  // ─── 标签存在性 ───────────────────────────────────

  async getTagsByIds(tagIds: number[]) {
    return db
      .select({ id: productTagsTable.id })
      .from(productTagsTable)
      .where(inArray(productTagsTable.id, tagIds));
  },

  // ─── 原料存在性 ───────────────────────────────────

  async getIngredientById(ingredientId: number) {
    const rows = await db
      .select({ id: ingredientsTable.id })
      .from(ingredientsTable)
      .where(eq(ingredientsTable.id, ingredientId))
      .limit(1);
    return rows[0] ?? null;
  },
};
