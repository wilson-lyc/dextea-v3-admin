import { and, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  storesTable,
  menusTable,
  storeMenusTable,
  productsTable,
  productStoreStatusTable,
  customizationsTable,
  customizationOptionsTable,
  customizationOptionStoreStatusTable,
  ingredientsTable,
  storeIngredientsTable,
} from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/plugins/utils/pagination.js';

export const storeRepository = {
  async getStoreList(page: number, pageSize: number, keyword?: string) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    keyword = keyword?.trim();

    const baseQuery = db
      .select()
      .from(storesTable)
      .orderBy(storesTable.id)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(storesTable)
      .$dynamic();

    if (keyword) {
      const pattern = `%${keyword}%`;
      const filter = sql`${storesTable.name} like ${pattern} or ${storesTable.phone} like ${pattern} or ${storesTable.address} like ${pattern}`;
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

  async getStoreById(id: number) {
    const rows = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getStoreByAccount(account: string) {
    const rows = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.account, account))
      .limit(1);
    return rows[0] ?? null;
  },

  async createStore(data: typeof storesTable.$inferInsert) {
    const result = await db.insert(storesTable).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateStoreById(id: number, data: Partial<typeof storesTable.$inferInsert>) {
    await db
      .update(storesTable)
      .set(data)
      .where(eq(storesTable.id, id));
  },

  async deleteStoreMenuRelations(storeId: number) {
    await db
      .delete(storeMenusTable)
      .where(eq(storeMenusTable.storeId, storeId));
  },

  async insertStoreMenuRelation(storeId: number, menuId: number) {
    await db
      .insert(storeMenusTable)
      .values({ storeId, menuId });
  },

  async getMenuById(id: number) {
    const rows = await db
      .select()
      .from(menusTable)
      .where(eq(menusTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getAllStoreLocations() {
    return db
      .select({ id: storesTable.id, longitude: storesTable.longitude, latitude: storesTable.latitude })
      .from(storesTable);
  },

  /**
   * 门店商品列表（含门店上下架状态）
   *
   * LEFT JOIN productStoreStatusTable，通过 COALESCE 获取门店级状态。
   * 支持按全局状态 (productsTable.status) 和门店状态 (productStoreStatusTable.status) 筛选。
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

    const baseQuery = db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        price: productsTable.price,
        globalStatus: productsTable.status,
        storeStatus: sql<number>`COALESCE(${productStoreStatusTable.status}, 0)`,
      })
      .from(productsTable)
      .leftJoin(
        productStoreStatusTable,
        and(
          eq(productStoreStatusTable.productId, productsTable.id),
          eq(productStoreStatusTable.storeId, storeId),
        ),
      );

    if (conditions.length > 0) {
      baseQuery.where(and(...conditions));
    }

    if (params.storeStatus !== undefined) {
      baseQuery.having(eq(sql`COALESCE(${productStoreStatusTable.status}, 0)`, params.storeStatus));
    }

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(productsTable);

    if (params.globalStatus !== undefined) {
      countQuery.where(eq(productsTable.status, params.globalStatus));
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
   * 门店客制化项目列表（含门店状态）
   *
   * LEFT JOIN customizationOptionStoreStatusTable 查询门店级状态，
   * 子查询统计每个项目下的选项数量。
   */
  async listStoreCustomizations(storeId: number, params: { page: number; pageSize: number }) {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(100, Math.max(1, params.pageSize));
    const offset = (page - 1) * pageSize;

    const [items, countResult] = await Promise.all([
      db
        .select({
          id: customizationsTable.id,
          name: customizationsTable.name,
          globalStatus: customizationsTable.status,
          storeStatus: sql<number>`COALESCE(${customizationOptionStoreStatusTable.status}, 0)`,
          optionCount: sql<number>`(
            SELECT COUNT(*) FROM ${customizationOptionsTable}
            WHERE ${customizationOptionsTable.customizationId} = ${customizationsTable.id}
          )`,
        })
        .from(customizationsTable)
        .leftJoin(
          customizationOptionStoreStatusTable,
          and(
            eq(customizationOptionStoreStatusTable.customizationOptionId, customizationsTable.id),
            eq(customizationOptionStoreStatusTable.storeId, storeId),
          ),
        )
        .limit(pageSize)
        .offset(offset)
        .orderBy(customizationsTable.id),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customizationsTable),
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
