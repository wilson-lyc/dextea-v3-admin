import { and, count, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  customizationItems,
  products,
  customizationOptions,
  ingredients,
} from '@/plugins/db/mysql/schema.js';
import { CUSTOMIZATION_OPTION_STATUS } from '@dextea-admin/contracts/status';
import { withPagination } from '@/utils';

export interface ExportCustomizationItem {
  name: string;
  options: { name: string; price: number; sort: number }[];
}

// 加价以 DECIMAL 存储，MySQL 驱动返回为字符串；在出口层统一转为 number，
// 以符合契约 CustomizationOptionSchema.price 的 number 类型（避免响应序列化 500）。
function normalizeOption<T extends { price: string | number }>(o: T): Omit<T, 'price'> & { price: number } {
  return { ...o, price: Number(o.price) };
}

export const customizationRepository = {
  // ─── Customization CRUD ──────────────────────────

  async getCustomizationList(page: number, pageSize: number, keyword?: string, status?: number, productId?: number) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    keyword = keyword?.trim();

    const baseQuery = db
      .select({
        id: customizationItems.id,
        productId: customizationItems.productId,
        name: customizationItems.name,
        sort: customizationItems.sort,
        status: customizationItems.status,
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

    const [rows, countResult] = await Promise.all([
      withPagination(baseQuery, page, pageSize),
      countQuery,
    ]);

    const itemIds = rows.map((it) => it.id);
    const optionStats = new Map<
      number,
      { optionCount: number; activeOptionCount: number; disabledOptionCount: number }
    >();
    if (itemIds.length > 0) {
      const stats = await db
        .select({
          itemId: customizationOptions.itemId,
          total: count(),
          active: count(
            sql`case when ${customizationOptions.status} = ${CUSTOMIZATION_OPTION_STATUS.GLOBAL_ACTIVE.value} then 1 end`,
          ),
          disabled: count(
            sql`case when ${customizationOptions.status} = ${CUSTOMIZATION_OPTION_STATUS.GLOBAL_DISABLED.value} then 1 end`,
          ),
        })
        .from(customizationOptions)
        .where(inArray(customizationOptions.itemId, itemIds))
        .groupBy(customizationOptions.itemId);
      for (const s of stats) {
        optionStats.set(s.itemId, {
          optionCount: Number(s.total ?? 0),
          activeOptionCount: Number(s.active ?? 0),
          disabledOptionCount: Number(s.disabled ?? 0),
        });
      }
    }

    const items = rows.map((it) => ({
      ...it,
      optionCount: optionStats.get(it.id)?.optionCount ?? 0,
      activeOptionCount: optionStats.get(it.id)?.activeOptionCount ?? 0,
      disabledOptionCount: optionStats.get(it.id)?.disabledOptionCount ?? 0,
    }));

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
      .where(eq(customizationOptions.itemId, customizationId))
      .orderBy(customizationOptions.sort, customizationOptions.id);
    return rows.map(normalizeOption);
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
    const row = rows[0];
    return row ? normalizeOption(row) : null;
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

  async updateOptionStatusById(id: number, status: number) {
    const result = await db
      .update(customizationOptions)
      .set({ status })
      .where(eq(customizationOptions.id, id));
    return result[0]?.affectedRows ?? 0;
  },

  async getIngredientById(id: number) {
    const rows = await db
      .select({ id: ingredients.id })
      .from(ingredients)
      .where(eq(ingredients.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  // ─── 导出 / 导入 ────────────────────────────────

  async getCustomizationWithOptions(productId: number, ids?: number[]): Promise<ExportCustomizationItem[]> {
    const conditions = [eq(customizationItems.productId, productId)];
    if (ids && ids.length > 0) {
      conditions.push(inArray(customizationItems.id, ids));
    }

    const items = await db
      .select({
        id: customizationItems.id,
        name: customizationItems.name,
        sort: customizationItems.sort,
      })
      .from(customizationItems)
      .where(and(...conditions))
      .orderBy(customizationItems.sort, customizationItems.id);

    const itemIds = items.map((it) => it.id);
    let optionRows: { itemId: number; name: string; price: string | number; sort: number }[] = [];
    if (itemIds.length > 0) {
      optionRows = await db
        .select({
          itemId: customizationOptions.itemId,
          name: customizationOptions.name,
          price: customizationOptions.price,
          sort: customizationOptions.sort,
        })
        .from(customizationOptions)
        .where(inArray(customizationOptions.itemId, itemIds))
        .orderBy(customizationOptions.sort, customizationOptions.id);
    }

    return items.map((it) => ({
      name: it.name,
      options: optionRows
        .filter((o) => o.itemId === it.id)
        .map((o) => ({ name: o.name, price: Number(o.price), sort: o.sort })),
    }));
  },

  async importCustomizations(
    productId: number,
    items: { name: string; sort: number; options: { name: string; price: number; sort: number }[] }[],
    itemStatus: number,
    optionStatus: number,
  ) {
    return db.transaction(async (tx) => {
      let importedItemCount = 0;
      let importedOptionCount = 0;

      for (const item of items) {
        const [itemResult] = await tx
          .insert(customizationItems)
          .values({
            productId,
            name: item.name,
            sort: item.sort,
            status: itemStatus,
          });
        const itemId = Number(itemResult?.insertId ?? 0);
        if (itemId === 0) continue;
        importedItemCount += 1;

        for (const option of item.options) {
          const [optionResult] = await tx
            .insert(customizationOptions)
            .values({
              itemId,
              name: option.name,
              price: String(option.price),
              sort: option.sort,
              status: optionStatus,
              ingredientId: null,
              ingredientQuantity: 0,
            });
          if (Number(optionResult?.insertId ?? 0) !== 0) {
            importedOptionCount += 1;
          }
        }
      }

      return { importedItemCount, importedOptionCount };
    });
  },
};
