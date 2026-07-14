import { and, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  storesTable,
  productsTable,
  productStoreStatusTable,
  customizationsTable,
  customizationOptionsTable,
  customizationOptionStoreStatusTable,
  ingredientsTable,
  storeIngredientsTable,
} from '@/plugins/db/mysql/schema.js';

export const storeCatalogRepository = {
  async getStoreById(id: number) {
    const rows = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  /**
   * 门店商品列表（含门店上下架状态）
   *
   * LEFT JOIN productStoreStatusTable，通过 COALESCE 获取门店级状态。
   * 支持按全局状态 (productsTable.status) 和门店状态 (COALESCE(...)) 筛选，
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
      conditions.push(eq(productsTable.status, params.globalStatus));
    }

    if (params.storeStatus !== undefined) {
      conditions.push(
        eq(sql<number>`COALESCE(${productStoreStatusTable.status}, 0)`, params.storeStatus),
      );
    }

    const storeStatusJoin = and(
      eq(productStoreStatusTable.productId, productsTable.id),
      eq(productStoreStatusTable.storeId, storeId),
    );

    const baseQuery = db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        price: productsTable.price,
        globalStatus: productsTable.status,
        storeStatus: sql<number>`COALESCE(${productStoreStatusTable.status}, 0)`,
      })
      .from(productsTable)
      .leftJoin(productStoreStatusTable, storeStatusJoin);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(productsTable)
      .leftJoin(productStoreStatusTable, storeStatusJoin);

    if (conditions.length > 0) {
      const where = and(...conditions);
      baseQuery.where(where);
      countQuery.where(where);
    }

    const [items, countResult] = await Promise.all([
      baseQuery.limit(pageSize).offset(offset).orderBy(productsTable.id),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  },

  async upsertProductStoreStatus(storeId: number, productId: number, status: number) {
    await db
      .insert(productStoreStatusTable)
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
      conditions.push(eq(customizationsTable.productId, params.productId));
    }

    const baseQuery = db
      .select({
        id: customizationsTable.id,
        name: customizationsTable.name,
        globalStatus: customizationsTable.status,
        optionCount: sql<number>`(
          SELECT COUNT(*) FROM ${customizationOptionsTable}
          WHERE ${customizationOptionsTable.customizationId} = ${customizationsTable.id}
        )`,
      })
      .from(customizationsTable)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(customizationsTable)
      .$dynamic();

    if (conditions.length > 0) {
      const where = and(...conditions);
      baseQuery.where(where);
      countQuery.where(where);
    }

    const [items, countResult] = await Promise.all([
      baseQuery.limit(pageSize).offset(offset).orderBy(customizationsTable.id),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  },

  /**
   * 门店客制化选项列表（含门店状态）
   *
   * LEFT JOIN customizationOptionStoreStatusTable 查询门店级状态，
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

    const [items, countResult] = await Promise.all([
      db
        .select({
          id: customizationOptionsTable.id,
          name: customizationOptionsTable.name,
          price: customizationOptionsTable.price,
          globalStatus: customizationOptionsTable.status,
          storeStatus: sql<number>`COALESCE(${customizationOptionStoreStatusTable.status}, 0)`,
        })
        .from(customizationOptionsTable)
        .leftJoin(
          customizationOptionStoreStatusTable,
          and(
            eq(customizationOptionStoreStatusTable.customizationOptionId, customizationOptionsTable.id),
            eq(customizationOptionStoreStatusTable.storeId, storeId),
          ),
        )
        .where(eq(customizationOptionsTable.customizationId, customizationId))
        .limit(pageSize)
        .offset(offset)
        .orderBy(customizationOptionsTable.sort, customizationOptionsTable.id),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customizationOptionsTable)
        .where(eq(customizationOptionsTable.customizationId, customizationId)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  },

  async upsertCustomizationOptionStoreStatus(storeId: number, optionId: number, status: number) {
    await db
      .insert(customizationOptionStoreStatusTable)
      .values({ customizationOptionId: optionId, storeId, status })
      .onDuplicateKeyUpdate({
        set: { status },
      });
  },

  /**
   * 门店原料库存列表
   *
   * LEFT JOIN storeIngredientsTable 查询门店级库存数量（COALESCE 默认 0）。
   */
  async listStoreIngredients(storeId: number, params: { page: number; pageSize: number }) {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(100, Math.max(1, params.pageSize));
    const offset = (page - 1) * pageSize;

    const [items, countResult] = await Promise.all([
      db
        .select({
          id: ingredientsTable.id,
          name: ingredientsTable.name,
          unit: ingredientsTable.unit,
          quantity: sql<number>`COALESCE(${storeIngredientsTable.quantity}, 0)`,
        })
        .from(ingredientsTable)
        .leftJoin(
          storeIngredientsTable,
          and(
            eq(storeIngredientsTable.ingredientId, ingredientsTable.id),
            eq(storeIngredientsTable.storeId, storeId),
          ),
        )
        .limit(pageSize)
        .offset(offset)
        .orderBy(ingredientsTable.id),
      db
        .select({ count: sql<number>`count(*)` })
        .from(ingredientsTable),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  },
};
