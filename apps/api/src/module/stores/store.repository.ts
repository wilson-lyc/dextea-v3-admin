import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  storesTable,
  menusTable,
  storeMenusTable,
} from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils/pagination.js';

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
};
