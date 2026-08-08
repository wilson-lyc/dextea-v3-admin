import { eq, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  customizationItems,
  products,
  customizationOptions,
  ingredients,
} from '@/plugins/db/mysql/schema.js';
import { CUSTOMIZATION_OPTION_STATUS } from '@dextea-admin/contracts/status';
import { withPagination } from '@/utils';

export const customizationRepository = {
  // ─── Customization CRUD ──────────────────────────

  async getCustomizationList(page: number, pageSize: number, keyword?: string, status?: number, productId?: number) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    keyword = keyword?.trim();

    const optionCountSubquery = sql<number>`(select count(*) from ${customizationOptions} where ${customizationOptions.itemId} = ${customizationItems.id})`;
    const activeOptionCountSubquery = sql<number>`(select count(*) from ${customizationOptions} where ${customizationOptions.itemId} = ${customizationItems.id} and ${customizationOptions.status} = ${CUSTOMIZATION_OPTION_STATUS.GLOBAL_ACTIVE.value})`;
    const disabledOptionCountSubquery = sql<number>`(select count(*) from ${customizationOptions} where ${customizationOptions.itemId} = ${customizationItems.id} and ${customizationOptions.status} = ${CUSTOMIZATION_OPTION_STATUS.GLOBAL_DISABLED.value})`;

    const baseQuery = db
      .select({
        id: customizationItems.id,
        productId: customizationItems.productId,
        name: customizationItems.name,
        sort: customizationItems.sort,
        status: customizationItems.status,
        optionCount: optionCountSubquery,
        activeOptionCount: activeOptionCountSubquery,
        disabledOptionCount: disabledOptionCountSubquery,
        createdAt: customizationItems.createdAt,
        updatedAt: customizationItems.updatedAt,
      })
      .from(customizationItems)
      .orderBy(customizationItems.sort, customizationItems.id)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(customizationItems)
      .$dynamic();

    const conditions: ReturnType<typeof sql>[] = [];
    if (keyword) {
      const pattern = `%${keyword}%`;
      conditions.push(sql`${customizationItems.name} like ${pattern}`);
    }
    if (status !== undefined) {
      conditions.push(eq(customizationItems.status, status));
    }
    if (productId !== undefined) {
      conditions.push(eq(customizationItems.productId, productId));
    }

    if (conditions.length > 0) {
      const whereClause = conditions.reduce((acc, c) => sql`${acc} and ${c}`);
      baseQuery.where(whereClause);
      countQuery.where(whereClause);
    }

    const [items, countResult] = await Promise.all([
      withPagination(baseQuery, page, pageSize),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return { items, total, page, pageSize };
  },

  async getCustomizationById(id: number) {
    const rows = await db
      .select()
      .from(customizationItems)
      .where(eq(customizationItems.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getProductById(id: number) {
    const rows = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async createCustomization(data: typeof customizationItems.$inferInsert) {
    const result = await db.insert(customizationItems).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateCustomizationById(id: number, data: Partial<typeof customizationItems.$inferInsert>) {
    await db
      .update(customizationItems)
      .set(data)
      .where(eq(customizationItems.id, id));
  },

  async updateCustomizationStatusById(id: number, status: number) {
    const result = await db
      .update(customizationItems)
      .set({ status })
      .where(eq(customizationItems.id, id));
    return result[0]?.affectedRows ?? 0;
  },

  // ─── Option CRUD ────────────────────────────────

  async getOptionList(customizationId: number) {
    return db
      .select({
        id: customizationOptions.id,
        customizationId: customizationOptions.itemId,
        name: customizationOptions.name,
        price: customizationOptions.price,
        sort: customizationOptions.sort,
        status: customizationOptions.status,
        ingredientId: customizationOptions.ingredientId,
        ingredientName: sql<string>`coalesce(${ingredients.name}, '')`,
        quantity: sql<number>`coalesce(${customizationOptions.ingredientQuantity}, 0)`,
        createdAt: customizationOptions.createdAt,
        updatedAt: customizationOptions.updatedAt,
      })
      .from(customizationOptions)
      .leftJoin(ingredients, eq(customizationOptions.ingredientId, ingredients.id))
      .where(eq(customizationOptions.itemId, customizationId))
      .orderBy(customizationOptions.sort, customizationOptions.id);
  },

  async getOptionById(id: number) {
    const rows = await db
      .select()
      .from(customizationOptions)
      .where(eq(customizationOptions.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getOptionByIdWithIngredient(id: number) {
    const rows = await db
      .select({
        id: customizationOptions.id,
        customizationId: customizationOptions.itemId,
        name: customizationOptions.name,
        price: customizationOptions.price,
        sort: customizationOptions.sort,
        status: customizationOptions.status,
        ingredientId: customizationOptions.ingredientId,
        ingredientName: sql<string>`coalesce(${ingredients.name}, '')`,
        quantity: sql<number>`coalesce(${customizationOptions.ingredientQuantity}, 0)`,
        createdAt: customizationOptions.createdAt,
        updatedAt: customizationOptions.updatedAt,
      })
      .from(customizationOptions)
      .leftJoin(ingredients, eq(customizationOptions.ingredientId, ingredients.id))
      .where(eq(customizationOptions.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async createOption(data: typeof customizationOptions.$inferInsert) {
    const result = await db.insert(customizationOptions).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateOptionById(id: number, data: Partial<typeof customizationOptions.$inferInsert>) {
    await db
      .update(customizationOptions)
      .set(data)
      .where(eq(customizationOptions.id, id));
  },

  async getIngredientById(id: number) {
    const rows = await db
      .select({ id: ingredients.id })
      .from(ingredients)
      .where(eq(ingredients.id, id))
      .limit(1);
    return rows[0] ?? null;
  },
};
