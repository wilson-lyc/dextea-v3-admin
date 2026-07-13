import { eq, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  ingredientsTable,
  productsTable,
  productIngredientsTable,
  customizationOptionsTable,
  customizationsTable,
} from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/plugins/utils/pagination.js';

export const ingredientRepository = {
  // ──── 原料基础 CRUD ────

  async getIngredientList(page: number, pageSize: number, keyword?: string) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    keyword = keyword?.trim();

    const offset = (page - 1) * pageSize;

    let query = db
      .select({
        id: ingredientsTable.id,
        name: ingredientsTable.name,
        unit: ingredientsTable.unit,
        status: ingredientsTable.status,
        boundCount: sql<number>`(select count(*) from ${productIngredientsTable} where ${productIngredientsTable.ingredientId} = ${ingredientsTable.id})`,
        optionCount: sql<number>`(select count(*) from ${customizationOptionsTable} where ${customizationOptionsTable.ingredientId} = ${ingredientsTable.id})`,
        createdAt: ingredientsTable.createdAt,
        updatedAt: ingredientsTable.updatedAt,
      })
      .from(ingredientsTable)
      .$dynamic();

    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(ingredientsTable)
      .$dynamic();

    if (keyword) {
      const pattern = `%${keyword}%`;
      const filter = sql`${ingredientsTable.name} like ${pattern}`;
      query = query.where(filter);
      countQuery = countQuery.where(filter);
    }

    const items = await query
      .limit(pageSize)
      .offset(offset)
      .orderBy(ingredientsTable.id);

    const countResult = await countQuery;
    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  },

  async getIngredientById(id: number) {
    const rows = await db
      .select({
        id: ingredientsTable.id,
        name: ingredientsTable.name,
        unit: ingredientsTable.unit,
        status: ingredientsTable.status,
        boundCount: sql<number>`(select count(*) from ${productIngredientsTable} where ${productIngredientsTable.ingredientId} = ${ingredientsTable.id})`,
        optionCount: sql<number>`(select count(*) from ${customizationOptionsTable} where ${customizationOptionsTable.ingredientId} = ${ingredientsTable.id})`,
        createdAt: ingredientsTable.createdAt,
        updatedAt: ingredientsTable.updatedAt,
      })
      .from(ingredientsTable)
      .where(eq(ingredientsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getIngredientByName(name: string) {
    const rows = await db
      .select()
      .from(ingredientsTable)
      .where(eq(ingredientsTable.name, name))
      .limit(1);
    return rows[0] ?? null;
  },

  async createIngredient(data: typeof ingredientsTable.$inferInsert) {
    const result = await db.insert(ingredientsTable).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateIngredient(id: number, data: Partial<typeof ingredientsTable.$inferInsert>) {
    await db
      .update(ingredientsTable)
      .set(data)
      .where(eq(ingredientsTable.id, id));
  },

  // ──── 绑定商品（只读查询） ────

  async getIngredientProductList(ingredientId: number, page: number, pageSize: number) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    const baseQuery = db
      .select({
        productId: productIngredientsTable.productId,
        productName: productsTable.name,
        quantity: productIngredientsTable.quantity,
        sort: productIngredientsTable.sort,
      })
      .from(productIngredientsTable)
      .innerJoin(productsTable, eq(productIngredientsTable.productId, productsTable.id))
      .where(eq(productIngredientsTable.ingredientId, ingredientId))
      .orderBy(productIngredientsTable.productId)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(productIngredientsTable)
      .where(eq(productIngredientsTable.ingredientId, ingredientId));

    const [items, countResult] = await Promise.all([
      withPagination(baseQuery, page, pageSize),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return { items, total, page, pageSize };
  },

  // ──── 客制化选项绑定 ────

  async getIngredientOptionList(ingredientId: number, page: number, pageSize: number) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    const baseQuery = db
      .select({
        optionId: customizationOptionsTable.id,
        optionName: customizationOptionsTable.name,
        customizationName: customizationsTable.name,
        quantity: customizationOptionsTable.ingredientQuantity,
      })
      .from(customizationOptionsTable)
      .innerJoin(customizationsTable, eq(customizationOptionsTable.customizationId, customizationsTable.id))
      .where(eq(customizationOptionsTable.ingredientId, ingredientId))
      .orderBy(customizationOptionsTable.id)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(customizationOptionsTable)
      .where(eq(customizationOptionsTable.ingredientId, ingredientId));

    const [items, countResult] = await Promise.all([
      withPagination(baseQuery, page, pageSize),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return { items, total, page, pageSize };
  },

  // ──── 选项列表（供 SelectPicker） ────

  async getIngredientOptionSelectList() {
    return db
      .select({
        label: ingredientsTable.name,
        value: sql<string>`cast(${ingredientsTable.id} as char)`,
        unit: ingredientsTable.unit,
      })
      .from(ingredientsTable)
      .orderBy(ingredientsTable.id);
  },
};
