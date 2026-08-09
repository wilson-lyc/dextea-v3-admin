import { and, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  stores,
  products,
  productStoreStatus,
  customizationItems,
  customizationOptions,
  customizationOptionStoreStatus,
  ingredients,
  storeIngredients,
} from '@/plugins/db/mysql/schema.js';

export const storeCatalogRepository = {
  async getStoreById(id: number) {
    const rows = await db
      .select()
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  /**
   * 门店商品列表（含门店上下架状态）
   *
   * LEFT JOIN productStoreStatus，通过 COALESCE 获取门店级状态。
   * 支持按全局状态 (products.status) 和门店状态 (COALESCE(...)) 筛选，
   * 列表与总数使用同一组 conditions，保证分页总数一致。
   */
  async listStoreProducts(
    storeId: number,
    params: { page: number; pageSize: number; globalStatus?: number; storeStatus?: number },
  ) {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(100, Math.max(1, params.pageSize));
    const offset = (page - 1) * pageSize;

    const conditions: (SQL | undefined)[] = [];

    if (params.globalStatus !== undefined) {
      conditions.push(eq(products.status, params.globalStatus));
    }

    if (params.storeStatus !== undefined) {
      conditions.push(
        eq(sql<number>`COALESCE(${productStoreStatus.status}, 0)`, params.storeStatus),
      );
    }

    const storeStatusJoin = and(
      eq(productStoreStatus.productId, products.id),
      eq(productStoreStatus.storeId, storeId),
    );

    const baseQuery = db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        globalStatus: products.status,
        storeStatus: sql<number>`COALESCE(${productStoreStatus.status}, 0)`,
      })
      .from(products)
      .leftJoin(productStoreStatus, storeStatusJoin);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .leftJoin(productStoreStatus, storeStatusJoin);

    if (conditions.length > 0) {
      const where = and(...conditions);
      baseQuery.where(where);
      countQuery.where(where);
    }

    const [rows, countResult] = await Promise.all([
      baseQuery.limit(pageSize).offset(offset).orderBy(products.id),
      countQuery,
    ]);

    const items = rows.map((row) => ({ ...row, price: Number(row.price) }));
    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  },

  async upsertProductStoreStatus(storeId: number, productId: number, status: number) {
    await db
      .insert(productStoreStatus)
      .values({ productId, storeId, status })
      .onDuplicateKeyUpdate({
        set: { status },
      });
  },

  /**
   * 门店客制化项目列表
   *
   * 客制化项目本身不设门店状态，仅返回全局状态与选项数量。
   * 通过可选 productId 过滤「商品绑定的客制化项目」。
   */
  async listStoreCustomizations(
    storeId: number,
    params: { page: number; pageSize: number; productId?: number },
  ) {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(100, Math.max(1, params.pageSize));
    const offset = (page - 1) * pageSize;

    const conditions: (SQL | undefined)[] = [];
    if (params.productId !== undefined) {
      conditions.push(eq(customizationItems.productId, params.productId));
    }

    const baseQuery = db
      .select({
        id: customizationItems.id,
        name: customizationItems.name,
        globalStatus: customizationItems.status,
        optionCount: sql<number>`(
          SELECT COUNT(*) FROM ${customizationOptions}
          WHERE ${customizationOptions.itemId} = ${customizationItems.id}
        )`,
      })
      .from(customizationItems)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(customizationItems)
      .$dynamic();

    if (conditions.length > 0) {
      const where = and(...conditions);
      baseQuery.where(where);
      countQuery.where(where);
    }

    const [items, countResult] = await Promise.all([
      baseQuery.limit(pageSize).offset(offset).orderBy(customizationItems.id),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  },

  /**
   * 门店客制化选项列表（含门店状态）
   *
   * LEFT JOIN customizationOptionStoreStatus 查询门店级状态，
   * 按 customizationId 筛选，按 sort / id 排序。
   */
  async listStoreCustomizationOptions(
    storeId: number,
    customizationId: number,
    params: { page: number; pageSize: number },
  ) {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(100, Math.max(1, params.pageSize));
    const offset = (page - 1) * pageSize;

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: customizationOptions.id,
          name: customizationOptions.name,
          price: customizationOptions.price,
          globalStatus: customizationOptions.status,
          storeStatus: sql<number>`COALESCE(${customizationOptionStoreStatus.status}, 0)`,
        })
        .from(customizationOptions)
        .leftJoin(
          customizationOptionStoreStatus,
          and(
            eq(customizationOptionStoreStatus.optionId, customizationOptions.id),
            eq(customizationOptionStoreStatus.storeId, storeId),
          ),
        )
        .where(eq(customizationOptions.itemId, customizationId))
        .limit(pageSize)
        .offset(offset)
        .orderBy(customizationOptions.sort, customizationOptions.id),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customizationOptions)
        .where(eq(customizationOptions.itemId, customizationId)),
    ]);

    const items = rows.map((row) => ({ ...row, price: Number(row.price) }));
    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  },

  async upsertCustomizationOptionStoreStatus(storeId: number, optionId: number, status: number) {
    await db
      .insert(customizationOptionStoreStatus)
      .values({ optionId, storeId, status })
      .onDuplicateKeyUpdate({
        set: { status },
      });
  },

  /**
   * 门店原料库存列表
   *
   * LEFT JOIN storeIngredients 查询门店级库存数量（COALESCE 默认 0）。
   */
  async listStoreIngredients(storeId: number, params: { page: number; pageSize: number }) {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(100, Math.max(1, params.pageSize));
    const offset = (page - 1) * pageSize;

    const [items, countResult] = await Promise.all([
      db
        .select({
          id: ingredients.id,
          name: ingredients.name,
          unit: ingredients.unit,
          quantity: sql<number>`COALESCE(${storeIngredients.quantity}, 0)`,
        })
        .from(ingredients)
        .leftJoin(
          storeIngredients,
          and(
            eq(storeIngredients.ingredientId, ingredients.id),
            eq(storeIngredients.storeId, storeId),
          ),
        )
        .limit(pageSize)
        .offset(offset)
        .orderBy(ingredients.id),
      db
        .select({ count: sql<number>`count(*)` })
        .from(ingredients),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  },
};
