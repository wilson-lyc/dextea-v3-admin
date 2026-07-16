import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  stores,
  menus,
  storeMenus,
} from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils';

export const storeRepository = {
  async getStoreList(page: number, pageSize: number, keyword?: string) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    keyword = keyword?.trim();

    const baseQuery = db
      .select()
      .from(stores)
      .orderBy(stores.id)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(stores)
      .$dynamic();

    if (keyword) {
      const pattern = `%${keyword}%`;
      const filter = sql`${stores.name} like ${pattern} or ${stores.phone} like ${pattern} or ${stores.address} like ${pattern}`;
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
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getStoreByAccount(account: string) {
    const rows = await db
      .select()
      .from(stores)
      .where(eq(stores.account, account))
      .limit(1);
    return rows[0] ?? null;
  },

  async createStore(data: typeof stores.$inferInsert) {
    const result = await db.insert(stores).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateStoreById(id: number, data: Partial<typeof stores.$inferInsert>) {
    await db
      .update(stores)
      .set(data)
      .where(eq(stores.id, id));
  },

  async deleteStoreMenuRelations(storeId: number) {
    await db
      .delete(storeMenus)
      .where(eq(storeMenus.storeId, storeId));
  },

  async insertStoreMenuRelation(storeId: number, menuId: number) {
    await db
      .insert(storeMenus)
      .values({ storeId, menuId });
  },

  async getMenuById(id: number) {
    const rows = await db
      .select()
      .from(menus)
      .where(eq(menus.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async getAllStoreLocations() {
    return db
      .select({ id: stores.id, longitude: stores.longitude, latitude: stores.latitude })
      .from(stores);
  },
};
