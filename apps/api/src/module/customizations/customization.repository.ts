import { eq, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  customizations,
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

    const optionCountSubquery = sql<number>`(select count(*) from ${customizationOptions} where ${customizationOptions.customizationId} = customizations.id)`;
    const activeOptionCountSubquery = sql<number>`(select count(*) from ${customizationOptions} where ${customizationOptions.customizationId} = customizations.id and ${customizationOptions.status} = ${CUSTOMIZATION_OPTION_STATUS.ACTIVE.value})`;
    const disabledOptionCountSubquery = sql<number>`(select count(*) from ${customizationOptions} where ${customizationOptions.customizationId} = customizations.id and ${customizationOptions.status} = ${CUSTOMIZATION_OPTION_STATUS.DISABLED.value})`;

    const baseQuery = db
      .select({
        id: customizations.id,
        productId: customizations.productId,
        name: customizations.name,
        sort: customizations.sort,
        status: customizations.status,
        optionCount: optionCountSubquery,
        activeOptionCount: activeOptionCountSubquery,
        disabledOptionCount: disabledOptionCountSubquery,
        createdAt: customizations.createdAt,
        updatedAt: customizations.updatedAt,
      })
      .from(customizations)
      .orderBy(customizations.sort, customizations.id)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(customizations)
      .$dynamic();

    const conditions: ReturnType<typeof sql>[] = [];
    if (keyword) {
      const pattern = `%${keyword}%`;
      conditions.push(sql`${customizations.name} like ${pattern}`);
    }
    if (status !== undefined) {
      conditions.push(eq(customizations.status, status));
    }
    if (productId !== undefined) {
      conditions.push(eq(customizations.productId, productId));
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
      .from(customizations)
      .where(eq(customizations.id, id))
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

  async createCustomization(data: typeof customizations.$inferInsert) {
    const result = await db.insert(customizations).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateCustomizationById(id: number, data: Partial<typeof customizations.$inferInsert>) {
    await db
      .update(customizations)
      .set(data)
      .where(eq(customizations.id, id));
  },

  // ─── Option CRUD ────────────────────────────────

  async getOptionList(customizationId: number) {
    return db
      .select({
        id: customizationOptions.id,
        customizationId: customizationOptions.customizationId,
        name: customizationOptions.name,
        price: customizationOptions.price,
        sort: customizationOptions.sort,
        status: customizationOptions.status,
        ingredientId: customizationOptions.ingredientId,
        ingredientName: sql<string>`coalesce(${ingredients.name}, '')`,
        quantity: customizationOptions.ingredientQuantity,
        createdAt: customizationOptions.createdAt,
        updatedAt: customizationOptions.updatedAt,
      })
      .from(customizationOptions)
      .leftJoin(ingredients, eq(customizationOptions.ingredientId, ingredients.id))
      .where(eq(customizationOptions.customizationId, customizationId))
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
        customizationId: customizationOptions.customizationId,
        name: customizationOptions.name,
        price: customizationOptions.price,
        sort: customizationOptions.sort,
        status: customizationOptions.status,
        ingredientId: customizationOptions.ingredientId,
        ingredientName: sql<string>`coalesce(${ingredients.name}, '')`,
        quantity: customizationOptions.ingredientQuantity,
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
