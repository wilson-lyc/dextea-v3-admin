import type { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql, type SQL } from 'drizzle-orm';

type Database = MySql2Database<Record<string, unknown>>;
import {
  storesTable,
  productsTable,
  productStoreStatusTable,
  productCustomizationsTable,
  customizationOptionsTable,
  customizationOptionStoreStatusTable,
  ingredientsTable,
  storeInventoryTable,
} from '../plugins/db/mysql/schema.js';
import { BizError } from '@/common/exceptions/index.js';
import { StoreErrorCodes } from '@/module/stores/store.errorcode.js';
import type {
  PaginatedData,
  StoreProductItem,
  StoreCustomizationItem,
  StoreCustomizationOptionItem,
  StoreIngredientItem,
} from '@dextea/shared-types';

async function ensureStoreExists(db: Database, storeId: number): Promise<void> {
  const [store] = await db
    .select({ id: storesTable.id })
    .from(storesTable)
    .where(eq(storesTable.id, storeId))
    .limit(1);
  if (!store) throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
}

/**
 * 门店商品列表（含门店上下架状态）
 *
 * LEFT JOIN productStoreStatusTable，通过 COALESCE 获取门店级状态。
 * 支持按全局状态 (productsTable.status) 和门店状态 (productStoreStatusTable.status) 筛选。
 */
export async function listStoreProducts(
  db: Database,
  storeId: number,
  params: { page: number; pageSize: number; globalStatus?: number; storeStatus?: number },
): Promise<PaginatedData<StoreProductItem>> {
  await ensureStoreExists(db, storeId);

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

  // 并行查询总数与列表（总数仅应用全局状态筛选，门店状态筛选需要 LEFT JOIN 不在此处处理）
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
}

export async function upsertProductStoreStatus(
  db: Database,
  storeId: number,
  productId: number,
  status: number,
): Promise<void> {
  await ensureStoreExists(db, storeId);

  await db
    .insert(productStoreStatusTable)
    .values({ productId, storeId, status })
    .onDuplicateKeyUpdate({
      set: { status },
    });
}

/**
 * 门店客制化项目列表（含门店状态）
 *
 * LEFT JOIN customizationOptionStoreStatusTable 查询门店级状态，
 * 子查询统计每个项目下的选项数量。
 */
export async function listStoreCustomizations(
  db: Database,
  storeId: number,
  params: { page: number; pageSize: number },
): Promise<PaginatedData<StoreCustomizationItem>> {
  await ensureStoreExists(db, storeId);

  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const offset = (page - 1) * pageSize;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: productCustomizationsTable.id,
        name: productCustomizationsTable.name,
        globalStatus: productCustomizationsTable.status,
        storeStatus: sql<number>`COALESCE(${customizationOptionStoreStatusTable.status}, 0)`,
        optionCount: sql<number>`(
          SELECT COUNT(*) FROM ${customizationOptionsTable}
          WHERE ${customizationOptionsTable.customizationId} = ${productCustomizationsTable.id}
        )`,
      })
      .from(productCustomizationsTable)
      .leftJoin(
        customizationOptionStoreStatusTable,
        and(
          eq(customizationOptionStoreStatusTable.customizationOptionId, productCustomizationsTable.id),
          eq(customizationOptionStoreStatusTable.storeId, storeId),
        ),
      )
      .limit(pageSize)
      .offset(offset)
      .orderBy(productCustomizationsTable.id),
    db
      .select({ count: sql<number>`count(*)` })
      .from(productCustomizationsTable),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return { items, total, page, pageSize };
}

/**
 * 门店客制化选项列表（含门店状态）
 *
 * LEFT JOIN customizationOptionStoreStatusTable 查询门店级状态，
 * 按 customizationId 筛选，按 sort / id 排序。
 */
export async function listStoreCustomizationOptions(
  db: Database,
  storeId: number,
  customizationId: number,
  params: { page: number; pageSize: number },
): Promise<PaginatedData<StoreCustomizationOptionItem>> {
  await ensureStoreExists(db, storeId);

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
}

export async function upsertCustomizationOptionStoreStatus(
  db: Database,
  storeId: number,
  optionId: number,
  status: number,
): Promise<void> {
  await ensureStoreExists(db, storeId);

  await db
    .insert(customizationOptionStoreStatusTable)
    .values({ customizationOptionId: optionId, storeId, status })
    .onDuplicateKeyUpdate({
      set: { status },
    });
}

/**
 * 门店原料库存列表
 *
 * LEFT JOIN storeInventoryTable 查询门店级库存数量（COALESCE 默认 0）。
 */
export async function listStoreIngredients(
  db: Database,
  storeId: number,
  params: { page: number; pageSize: number },
): Promise<PaginatedData<StoreIngredientItem>> {
  await ensureStoreExists(db, storeId);

  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const offset = (page - 1) * pageSize;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: ingredientsTable.id,
        name: ingredientsTable.name,
        unit: ingredientsTable.unit,
        quantity: sql<number>`COALESCE(${storeInventoryTable.quantity}, 0)`,
      })
      .from(ingredientsTable)
      .leftJoin(
        storeInventoryTable,
        and(
          eq(storeInventoryTable.ingredientId, ingredientsTable.id),
          eq(storeInventoryTable.storeId, storeId),
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
}
