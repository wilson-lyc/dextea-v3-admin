import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  products,
  productTags,
  productTagMap,
  productIngredients,
  ingredients,
  productImages,
  gallery,
} from '@/plugins/db/mysql/schema.js';
import { PRODUCT_IMAGE_TYPE } from '@dextea-admin/contracts';
import { withPagination } from '@/utils';

// 价格以 DECIMAL 存储，MySQL 驱动返回为字符串；在出口层统一转为 number，
// 以符合契约 ProductSchema.price 的 number 类型（避免响应序列化 500）。
function normalizeProduct<T extends { price: string | number }>(p: T): Omit<T, 'price'> & { price: number } {
  return { ...p, price: Number(p.price) };
}

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
      .from(products)
      .orderBy(products.id)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .$dynamic();

    if (keyword?.trim()) {
      const pattern = `%${keyword.trim()}%`;
      const filter = sql`${products.name} like ${pattern}`;
      baseQuery.where(filter);
      countQuery.where(filter);
    }

    if (status !== undefined) {
      baseQuery.where(eq(products.status, status));
      countQuery.where(eq(products.status, status));
    }

    if (priceMin !== undefined && priceMin >= 0) {
      baseQuery.where(sql`${products.price} >= ${priceMin}`);
      countQuery.where(sql`${products.price} >= ${priceMin}`);
    }

    if (priceMax !== undefined && priceMax >= 0) {
      baseQuery.where(sql`${products.price} <= ${priceMax}`);
      countQuery.where(sql`${products.price} <= ${priceMax}`);
    }

    // 标签筛选：查找同时拥有所有指定标签的商品
    if (tagIds && tagIds.length > 0) {
      const matchingProductIds = await db
        .select({ productId: productTagMap.productId })
        .from(productTagMap)
        .where(inArray(productTagMap.tagId, tagIds))
        .groupBy(productTagMap.productId)
        .having(sql`count(distinct ${productTagMap.tagId}) = ${tagIds.length}`);

      const productIdSet = matchingProductIds.map(r => r.productId);
      if (productIdSet.length > 0) {
        baseQuery.where(inArray(products.id, productIdSet));
        countQuery.where(inArray(products.id, productIdSet));
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
          productId: productTagMap.productId,
          tagId: productTags.id,
          tagName: productTags.name,
        })
        .from(productTagMap)
        .innerJoin(productTags, eq(productTagMap.tagId, productTags.id))
        .where(inArray(productTagMap.productId, productIds));

      const tagsByProductId = new Map<number, { id: number; name: string }[]>();
      for (const rel of tagRelations) {
        if (!tagsByProductId.has(rel.productId)) {
          tagsByProductId.set(rel.productId, []);
        }
        tagsByProductId.get(rel.productId)!.push({ id: rel.tagId, name: rel.tagName });
      }

      const itemsWithTags = items.map(item => ({
        ...normalizeProduct(item),
        tags: tagsByProductId.get(item.id) ?? [],
      }));
      return { items: itemsWithTags, total, page, pageSize };
    }

    return { items: items.map(normalizeProduct), total, page, pageSize };
  },

  // ─── 商品基础信息 ─────────────────────────────────

  async getProductById(id: number) {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return rows[0] ? normalizeProduct(rows[0]) : null;
  },

  async getProductTagsById(id: number) {
    const relations = await db
      .select({
        id: productTags.id,
        name: productTags.name,
      })
      .from(productTagMap)
      .innerJoin(productTags, eq(productTagMap.tagId, productTags.id))
      .where(eq(productTagMap.productId, id))
      .orderBy(productTags.id);

    return relations;
  },

  // ─── 新增商品 ─────────────────────────────────────

  async createProduct(data: typeof products.$inferInsert) {
    const result = await db.insert(products).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  // ─── 更新商品 ─────────────────────────────────────

  async updateProductById(id: number, data: Partial<typeof products.$inferInsert>) {
    await db
      .update(products)
      .set(data)
      .where(eq(products.id, id));
  },

  // ─── 批量更新商品状态 ─────────────────────────────

  async batchUpdateProductStatus(ids: number[], status: number) {
    if (ids.length === 0) return 0;
    const result = await db
      .update(products)
      .set({ status })
      .where(inArray(products.id, ids));
    return result[0]?.affectedRows ?? 0;
  },

  // ─── 商品标签列表（分页） ─────────────────────────

  async getProductTagListWithPage(productId: number, page: number, pageSize: number) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (page - 1) * pageSize;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productTagMap)
      .where(eq(productTagMap.productId, productId));

    const total = Number(countResult?.count ?? 0);

    const tags = await db
      .select({
        id: productTags.id,
        name: productTags.name,
      })
      .from(productTagMap)
      .innerJoin(productTags, eq(productTagMap.tagId, productTags.id))
      .where(eq(productTagMap.productId, productId))
      .orderBy(productTags.id)
      .limit(pageSize)
      .offset(offset);

    return { items: tags, total, page, pageSize };
  },

  // ─── 商品-标签关联 ────────────────────────────────

  async insertProductTagRelations(
    relations: { productId: number; tagId: number }[],
  ) {
    if (relations.length === 0) return;
    await db.insert(productTagMap).values(relations);
  },

  async deleteProductTagRelations(productId: number, tagIds: number[]) {
    await db
      .delete(productTagMap)
      .where(
        and(
          eq(productTagMap.productId, productId),
          inArray(productTagMap.tagId, tagIds),
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
      .from(productIngredients)
      .where(eq(productIngredients.productId, productId));

    const total = Number(countResult?.count ?? 0);

    const rows = await db
      .select({
        ingredientId: productIngredients.ingredientId,
        ingredientName: ingredients.name,
        unit: ingredients.unit,
        quantity: productIngredients.quantity,
        sort: productIngredients.sort,
      })
      .from(productIngredients)
      .innerJoin(ingredients, eq(productIngredients.ingredientId, ingredients.id))
      .where(eq(productIngredients.productId, productId))
      .orderBy(productIngredients.sort, productIngredients.ingredientId)
      .limit(pageSize)
      .offset(offset);

    return { items: rows, total, page, pageSize };
  },

  // ─── 商品-原料关联 ────────────────────────────────

  async getProductIngredientRelation(productId: number, ingredientId: number) {
    const rows = await db
      .select()
      .from(productIngredients)
      .where(
        and(
          eq(productIngredients.productId, productId),
          eq(productIngredients.ingredientId, ingredientId),
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
    await db.insert(productIngredients).values(data);
  },

  async updateProductIngredientQuantity(
    productId: number,
    ingredientId: number,
    quantity: number,
  ) {
    await db
      .update(productIngredients)
      .set({ quantity })
      .where(
        and(
          eq(productIngredients.productId, productId),
          eq(productIngredients.ingredientId, ingredientId),
        ),
      );
  },

  async updateProductIngredientSort(
    productId: number,
    ingredientId: number,
    sort: number,
  ) {
    await db
      .update(productIngredients)
      .set({ sort })
      .where(
        and(
          eq(productIngredients.productId, productId),
          eq(productIngredients.ingredientId, ingredientId),
        ),
      );
  },

  async deleteProductIngredientRelation(productId: number, ingredientId: number) {
    await db
      .delete(productIngredients)
      .where(
        and(
          eq(productIngredients.productId, productId),
          eq(productIngredients.ingredientId, ingredientId),
        ),
      );
  },

  // ─── 商品选项列表 ─────────────────────────────────

  async getProductOptionSelectList() {
    return db
      .select({
        label: products.name,
        value: sql<string>`cast(${products.id} as char)`,
      })
      .from(products)
      .orderBy(products.id);
  },

  // ─── 标签存在性 ───────────────────────────────────

  async getTagsByIds(tagIds: number[]) {
    return db
      .select({ id: productTags.id })
      .from(productTags)
      .where(inArray(productTags.id, tagIds));
  },

  // ─── 原料存在性 ───────────────────────────────────

  async getIngredientById(ingredientId: number) {
    const rows = await db
      .select({ id: ingredients.id })
      .from(ingredients)
      .where(eq(ingredients.id, ingredientId))
      .limit(1);
    return rows[0] ?? null;
  },

  // ─── 商品图片（封面图 + 图库，统一存放于 product_images） ───

  /** 查询商品图片：封面（最多 1 张）+ 图库（按 sort 升序） */
  async getProductImages(productId: number) {
    const coverCols = {
      id: gallery.id,
      url: gallery.url,
      createdAt: gallery.createdAt,
    };

    const coverRows = await db
      .select(coverCols)
      .from(productImages)
      .innerJoin(gallery, eq(productImages.imageId, gallery.id))
      .where(
        and(
          eq(productImages.productId, productId),
          eq(productImages.type, PRODUCT_IMAGE_TYPE.COVER.value),
        ),
      )
      .limit(1);

    const galleryRows = await db
      .select(coverCols)
      .from(productImages)
      .innerJoin(gallery, eq(productImages.imageId, gallery.id))
      .where(
        and(
          eq(productImages.productId, productId),
          eq(productImages.type, PRODUCT_IMAGE_TYPE.GALLERY.value),
        ),
      )
      .orderBy(productImages.sort, gallery.id);

    return {
      cover: coverRows[0] ?? null,
      gallery: galleryRows,
    };
  },

  /** 批量校验图片资源是否存在（用于绑定前校验） */
  async getGalleryImagesByIds(ids: number[]) {
    if (ids.length === 0) return [];
    return db
      .select({ id: gallery.id })
      .from(gallery)
      .where(inArray(gallery.id, ids));
  },

  /** 全量替换商品图片：先删后插，封面与图库各自写入 */
  async setProductImages(
    productId: number,
    coverImageId: number | null,
    galleryImageIds: number[],
  ) {
    await db.transaction(async (tx) => {
      await tx
        .delete(productImages)
        .where(eq(productImages.productId, productId));

      if (coverImageId !== null) {
        await tx.insert(productImages).values({
          productId,
          imageId: coverImageId,
          type: PRODUCT_IMAGE_TYPE.COVER.value,
          sort: 0,
        });
      }

      if (galleryImageIds.length > 0) {
        await tx.insert(productImages).values(
          galleryImageIds.map((imageId, index) => ({
            productId,
            imageId,
            type: PRODUCT_IMAGE_TYPE.GALLERY.value,
            sort: index,
          })),
        );
      }
    });
  },
};
