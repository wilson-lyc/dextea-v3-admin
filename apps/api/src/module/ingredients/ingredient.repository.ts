import { eq, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  ingredients,
  products,
  productIngredients,
  customizationOptions,
  customizations,
} from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils';

export const ingredientRepository = {
  // ──── 原料基础 CRUD ────

  async getIngredientList(page: number, pageSize: number, keyword?: string) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    keyword = keyword?.trim();

    const offset = (page - 1) * pageSize;

    let query = db
      .select({
        id: ingredients.id,
        name: ingredients.name,
        unit: ingredients.unit,
        status: ingredients.status,
        boundCount: sql<number>`(select count(*) from ${productIngredients} where ${productIngredients.ingredientId} = ${ingredients.id})`,
        optionCount: sql<number>`(select count(*) from ${customizationOptions} where ${customizationOptions.ingredientId} = ${ingredients.id})`,
        createdAt: ingredients.createdAt,
        updatedAt: ingredients.updatedAt,
      })
      .from(ingredients)
      .$dynamic();

    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(ingredients)
      .$dynamic();

    if (keyword) {
      const pattern = `%${keyword}%`;
      const filter = sql`${ingredients.name} like ${pattern}`;
      query = query.where(filter);
      countQuery = countQuery.where(filter);
    }

    const items = await query
      .limit(pageSize)
      .offset(offset)
      .orderBy(ingredients.id);

    const countResult = await countQuery;
    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  },

  async getIngredientById(id: number) {
    const rows = await db
      .select({
        id: ingredients.id,
        name: ingredients.name,
        unit: ingredients.unit,
        status: ingredients.status,
        boundCount: sql<number>`(select count(*) from ${productIngredients} where ${productIngredients.ingredientId} = ${ingredients.id})`,
        optionCount: sql<number>`(select count(*) from ${customizationOptions} where ${customizationOptions.ingredientId} = ${ingredients.id})`,
        createdAt: ingredients.createdAt,
        updatedAt: ingredients.updatedAt,
      })
      .from(ingredients)
      .where(eq(ingredients.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getIngredientByName(name: string) {
    const rows = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.name, name))
      .limit(1);
    return rows[0] ?? null;
  },

  async createIngredient(data: typeof ingredients.$inferInsert) {
    const result = await db.insert(ingredients).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateIngredient(id: number, data: Partial<typeof ingredients.$inferInsert>) {
    await db
      .update(ingredients)
      .set(data)
      .where(eq(ingredients.id, id));
  },

  // ──── 绑定商品（只读查询） ────

  async getIngredientProductList(ingredientId: number, page: number, pageSize: number) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    const baseQuery = db
      .select({
        productId: productIngredients.productId,
        productName: products.name,
        quantity: productIngredients.quantity,
        sort: productIngredients.sort,
      })
      .from(productIngredients)
      .innerJoin(products, eq(productIngredients.productId, products.id))
      .where(eq(productIngredients.ingredientId, ingredientId))
      .orderBy(productIngredients.productId)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(productIngredients)
      .where(eq(productIngredients.ingredientId, ingredientId));

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
        optionId: customizationOptions.id,
        optionName: customizationOptions.name,
        customizationName: customizations.name,
        quantity: customizationOptions.ingredientQuantity,
      })
      .from(customizationOptions)
      .innerJoin(customizations, eq(customizationOptions.customizationId, customizations.id))
      .where(eq(customizationOptions.ingredientId, ingredientId))
      .orderBy(customizationOptions.id)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(customizationOptions)
      .where(eq(customizationOptions.ingredientId, ingredientId));

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
        label: ingredients.name,
        value: sql<string>`cast(${ingredients.id} as char)`,
        unit: ingredients.unit,
      })
      .from(ingredients)
      .orderBy(ingredients.id);
  },
};
