import { eq, sql, and, inArray, like } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  menusTable,
  menuGroupsTable,
  menuProductsTable,
  productsTable,
  storeMenusTable,
  storesTable,
} from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils';

export const menuRepository = {
  // ─── 菜单 ──────────────────────────────────────────

  async getMenuList(page: number, pageSize: number) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    const [items, countResult] = await Promise.all([
      withPagination(
        db
          .select({
            id: menusTable.id,
            name: menusTable.name,
            description: menusTable.description,
            createdAt: menusTable.createdAt,
            updatedAt: menusTable.updatedAt,
          })
          .from(menusTable)
          .orderBy(menusTable.id)
          .$dynamic(),
        page,
        pageSize,
      ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(menusTable),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return { items, total, page, pageSize };
  },

  async getMenuById(id: number) {
    const rows = await db
      .select()
      .from(menusTable)
      .where(eq(menusTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async createMenu(data: { name: string; description: string }) {
    const result = await db.insert(menusTable).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateMenuById(id: number, data: Partial<typeof menusTable.$inferInsert>) {
    await db
      .update(menusTable)
      .set(data)
      .where(eq(menusTable.id, id));
  },

  async hasBoundStores(menuIds: number[]) {
    if (menuIds.length === 0) return false;
    const rows = await db
      .select({ id: storeMenusTable.storeId })
      .from(storeMenusTable)
      .where(inArray(storeMenusTable.menuId, menuIds))
      .limit(1);
    return rows.length > 0;
  },

  async deleteMenuWithRelations(menuIds: number[]) {
    await db.transaction(async (tx) => {
      const groups = await tx
        .select({ id: menuGroupsTable.id })
        .from(menuGroupsTable)
        .where(inArray(menuGroupsTable.menuId, menuIds));

      const groupIds = groups.map(g => g.id);

      if (groupIds.length > 0) {
        await tx
          .delete(menuProductsTable)
          .where(inArray(menuProductsTable.groupId, groupIds));
      }

      await tx
        .delete(menuGroupsTable)
        .where(inArray(menuGroupsTable.menuId, menuIds));

      await tx
        .delete(menusTable)
        .where(inArray(menusTable.id, menuIds));
    });
  },

  // ─── 分组 ──────────────────────────────────────────

  async getMenuGroupList(menuId: number) {
    return db
      .select({
        id: menuGroupsTable.id,
        menuId: menuGroupsTable.menuId,
        name: menuGroupsTable.name,
        sortOrder: menuGroupsTable.sort,
        productCount: sql<number>`(select count(*) from ${menuProductsTable} where ${menuProductsTable.groupId} = ${menuGroupsTable.id})`,
        createdAt: menuGroupsTable.createdAt,
        updatedAt: menuGroupsTable.updatedAt,
      })
      .from(menuGroupsTable)
      .where(eq(menuGroupsTable.menuId, menuId))
      .orderBy(menuGroupsTable.sort, menuGroupsTable.id);
  },

  async getMenuGroupById(id: number) {
    const rows = await db
      .select()
      .from(menuGroupsTable)
      .where(eq(menuGroupsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async createMenuGroup(data: { menuId: number; name: string; sortOrder: number }) {
    const result = await db
      .insert(menuGroupsTable)
      .values({ menuId: data.menuId, name: data.name, sort: data.sortOrder });
    return Number(result[0]?.insertId ?? 0);
  },

  async updateMenuGroupById(id: number, data: Partial<{ name: string; sortOrder: number }>) {
    const values: { name?: string; sort?: number } = {};
    if (data.name !== undefined) values.name = data.name;
    if (data.sortOrder !== undefined) values.sort = data.sortOrder;
    await db
      .update(menuGroupsTable)
      .set(values)
      .where(eq(menuGroupsTable.id, id));
  },

  async deleteMenuGroupWithProducts(groupId: number) {
    await db.transaction(async (tx) => {
      await tx
        .delete(menuProductsTable)
        .where(eq(menuProductsTable.groupId, groupId));

      await tx
        .delete(menuGroupsTable)
        .where(eq(menuGroupsTable.id, groupId));
    });
  },

  async batchDeleteMenuGroups(groupIds: number[]) {
    if (groupIds.length === 0) return;

    await db.transaction(async (tx) => {
      await tx
        .delete(menuProductsTable)
        .where(inArray(menuProductsTable.groupId, groupIds));

      await tx
        .delete(menuGroupsTable)
        .where(inArray(menuGroupsTable.id, groupIds));
    });
  },

  // ─── 商品 ──────────────────────────────────────────

  async getMenuProductList(groupId: number) {
    return db
      .select({
        groupId: menuProductsTable.groupId,
        productId: menuProductsTable.productId,
        productName: productsTable.name,
        price: productsTable.price,
        status: productsTable.status,
        sortOrder: menuProductsTable.sort,
        createdAt: menuProductsTable.createdAt,
        updatedAt: menuProductsTable.updatedAt,
      })
      .from(menuProductsTable)
      .innerJoin(productsTable, eq(menuProductsTable.productId, productsTable.id))
      .where(eq(menuProductsTable.groupId, groupId))
      .orderBy(menuProductsTable.sort, menuProductsTable.productId);
  },

  async getMenuProduct(groupId: number, productId: number) {
    const rows = await db
      .select({ productId: menuProductsTable.productId })
      .from(menuProductsTable)
      .where(
        and(
          eq(menuProductsTable.groupId, groupId),
          eq(menuProductsTable.productId, productId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async addMenuProduct(data: { groupId: number; productId: number; sortOrder: number }) {
    await db
      .insert(menuProductsTable)
      .values({ groupId: data.groupId, productId: data.productId, sort: data.sortOrder });
  },

  async batchRemoveMenuProducts(groupId: number, productIds: number[]) {
    if (productIds.length === 0) return;

    await db
      .delete(menuProductsTable)
      .where(
        and(
          eq(menuProductsTable.groupId, groupId),
          inArray(menuProductsTable.productId, productIds),
        ),
      );
  },

  async updateMenuProductSort(groupId: number, productId: number, sortOrder: number) {
    await db
      .update(menuProductsTable)
      .set({ sort: sortOrder })
      .where(
        and(
          eq(menuProductsTable.groupId, groupId),
          eq(menuProductsTable.productId, productId),
        ),
      );
  },

  // ─── 门店关联 ──────────────────────────────────────

  async getMenuStoreList(menuId: number, page: number, pageSize: number) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(storeMenusTable)
      .where(eq(storeMenusTable.menuId, menuId));

    const total = Number(countResult[0]?.count ?? 0);

    const items = await withPagination(
      db
        .select({
          id: storesTable.id,
          name: storesTable.name,
          regionCode: storesTable.regionCode,
          address: storesTable.address,
          status: storesTable.status,
          businessHours: storesTable.businessHours,
          phone: storesTable.phone,
          longitude: storesTable.longitude,
          latitude: storesTable.latitude,
          account: storesTable.account,
          email: storesTable.email,
          createdAt: storesTable.createdAt,
          updatedAt: storesTable.updatedAt,
        })
        .from(storeMenusTable)
        .innerJoin(storesTable, eq(storeMenusTable.storeId, storesTable.id))
        .where(eq(storeMenusTable.menuId, menuId))
        .orderBy(storesTable.id)
        .$dynamic(),
      page,
      pageSize,
    );

    return { items, total, page, pageSize };
  },

  async countStoresByArea(regionPrefix: string) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(storesTable)
      .where(like(storesTable.regionCode, `${regionPrefix}%`));
    return Number(result?.count ?? 0);
  },

  async getUnboundStoreIdsByArea(menuId: number, regionPrefix: string) {
    return db
      .select({ id: storesTable.id })
      .from(storesTable)
      .where(
        and(
          like(storesTable.regionCode, `${regionPrefix}%`),
          sql`not exists (select 1 from ${storeMenusTable} where ${storeMenusTable.storeId} = ${storesTable.id} and ${storeMenusTable.menuId} = ${menuId})`,
        ),
      );
  },

  async getStoreIdsByIds(storeIds: number[]) {
    const rows = await db
      .select({ id: storesTable.id })
      .from(storesTable)
      .where(inArray(storesTable.id, storeIds));
    return rows.map(r => r.id);
  },

  async getBoundStoreIds(menuId: number, storeIds: number[]) {
    const rows = await db
      .select({ storeId: storeMenusTable.storeId })
      .from(storeMenusTable)
      .where(
        and(
          eq(storeMenusTable.menuId, menuId),
          inArray(storeMenusTable.storeId, storeIds),
        ),
      );
    return new Set(rows.map(r => r.storeId));
  },

  async insertStoreMenuRelations(values: { storeId: number; menuId: number }[]) {
    if (values.length === 0) return;
    await db.insert(storeMenusTable).values(values);
  },
};
