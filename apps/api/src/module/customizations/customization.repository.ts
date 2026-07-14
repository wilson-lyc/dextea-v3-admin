import { eq, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  customizationsTable,
  productsTable,
  customizationOptionsTable,
  ingredientsTable,
} from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/plugins/utils/pagination.js';

export const customizationRepository = {
  // ─── Customization CRUD ──────────────────────────

  async getCustomizationList(page: number, pageSize: number, keyword?: string, status?: number, productId?: number) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    keyword = keyword?.trim();

    const optionCountSubquery = sql<number>`(select count(*) from ${customizationOptionsTable} where ${customizationOptionsTable.customizationId} = ${customizationsTable.id})`;

    const baseQuery = db
      .select({
        id: customizationsTable.id,
        productId: customizationsTable.productId,
        name: customizationsTable.name,
        sort: customizationsTable.sort,
        status: customizationsTable.status,
        optionCount: optionCountSubquery,
        createdAt: customizationsTable.createdAt,
        updatedAt: customizationsTable.updatedAt,
      })
      .from(customizationsTable)
      .orderBy(customizationsTable.sort, customizationsTable.id)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(customizationsTable)
      .$dynamic();

    const conditions: ReturnType<typeof sql>[] = [];
    if (keyword) {
      const pattern = `%${keyword}%`;
      conditions.push(sql`${customizationsTable.name} like ${pattern}`);
    }
    if (status !== undefined) {
      conditions.push(eq(customizationsTable.status, status));
    }
    if (productId !== undefined) {
      conditions.push(eq(customizationsTable.productId, productId));
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
      .from(customizationsTable)
      .where(eq(customizationsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getMaxSortByProductId(productId: number) {
    const rows = await db
      .select({ maxSort: sql<number>`coalesce(max(${customizationsTable.sort}), 0)` })
      .from(customizationsTable)
      .where(eq(customizationsTable.productId, productId));
    return Number(rows[0]?.maxSort ?? 0);
  },

  async getProductById(id: number) {
    const rows = await db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async createCustomization(data: typeof customizationsTable.$inferInsert) {
    const result = await db.insert(customizationsTable).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateCustomizationById(id: number, data: Partial<typeof customizationsTable.$inferInsert>) {
    await db
      .update(customizationsTable)
      .set(data)
      .where(eq(customizationsTable.id, id));
  },

  // ─── Option CRUD ────────────────────────────────

  async getOptionList(customizationId: number) {
    return db
      .select({
        id: customizationOptionsTable.id,
        customizationId: customizationOptionsTable.customizationId,
        name: customizationOptionsTable.name,
        price: customizationOptionsTable.price,
        sort: customizationOptionsTable.sort,
        status: customizationOptionsTable.status,
        ingredientId: customizationOptionsTable.ingredientId,
        ingredientName: sql<string>`coalesce(${ingredientsTable.name}, '')`,
        quantity: customizationOptionsTable.ingredientQuantity,
        createdAt: customizationOptionsTable.createdAt,
        updatedAt: customizationOptionsTable.updatedAt,
      })
      .from(customizationOptionsTable)
      .leftJoin(ingredientsTable, eq(customizationOptionsTable.ingredientId, ingredientsTable.id))
      .where(eq(customizationOptionsTable.customizationId, customizationId))
      .orderBy(customizationOptionsTable.sort, customizationOptionsTable.id);
  },

  async getOptionById(id: number) {
    const rows = await db
      .select()
      .from(customizationOptionsTable)
      .where(eq(customizationOptionsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getOptionByIdWithIngredient(id: number) {
    const rows = await db
      .select({
        id: customizationOptionsTable.id,
        customizationId: customizationOptionsTable.customizationId,
        name: customizationOptionsTable.name,
        price: customizationOptionsTable.price,
        sort: customizationOptionsTable.sort,
        status: customizationOptionsTable.status,
        ingredientId: customizationOptionsTable.ingredientId,
        ingredientName: sql<string>`coalesce(${ingredientsTable.name}, '')`,
        quantity: customizationOptionsTable.ingredientQuantity,
        createdAt: customizationOptionsTable.createdAt,
        updatedAt: customizationOptionsTable.updatedAt,
      })
      .from(customizationOptionsTable)
      .leftJoin(ingredientsTable, eq(customizationOptionsTable.ingredientId, ingredientsTable.id))
      .where(eq(customizationOptionsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async createOption(data: typeof customizationOptionsTable.$inferInsert) {
    const result = await db.insert(customizationOptionsTable).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateOptionById(id: number, data: Partial<typeof customizationOptionsTable.$inferInsert>) {
    await db
      .update(customizationOptionsTable)
      .set(data)
      .where(eq(customizationOptionsTable.id, id));
  },

  async getIngredientById(id: number) {
    const rows = await db
      .select({ id: ingredientsTable.id })
      .from(ingredientsTable)
      .where(eq(ingredientsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },
};
