import { eq, sql, and, inArray } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  menus,
  menuGroups,
  menuProducts,
  products,
  storeMenus,
  stores,
} from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils';

/**
 * 按 省 / 市 / 区 构建门店筛选条件（仅匹配非空层级）。
 * 传入的 area 必须已经过 normalizeStoreRegion 归一化为门店存储格式，
 * 因此这里直接按数据库列逐级匹配即可（直辖市省列为空，会自动从 city 列开始匹配）。
 */
function buildAreaFilter(area: { province: string; city: string; district: string }) {
  const conditions: ReturnType<typeof eq>[] = [];

  if (area.province) conditions.push(eq(stores.province, area.province));
  if (area.city) conditions.push(eq(stores.city, area.city));
  if (area.district) conditions.push(eq(stores.district, area.district));

  return and(...conditions);
}

export const menuRepository = {
  // ─── 菜单 ──────────────────────────────────────────

  async getMenuList(page: number, pageSize: number) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    const [items, countResult] = await Promise.all([
      withPagination(
        db
          .select({
            id: menus.id,
            name: menus.name,
            description: menus.description,
            createdAt: menus.createdAt,
            updatedAt: menus.updatedAt,
          })
          .from(menus)
          .orderBy(menus.id)
          .$dynamic(),
        page,
        pageSize,
      ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(menus),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return { items, total, page, pageSize };
  },

  async getMenuById(id: number) {
    const rows = await db
      .select()
      .from(menus)
      .where(eq(menus.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async createMenu(data: { name: string; description: string }) {
    const result = await db.insert(menus).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateMenuById(id: number, data: Partial<typeof menus.$inferInsert>) {
    await db
      .update(menus)
      .set(data)
      .where(eq(menus.id, id));
  },

  async hasBoundStores(menuIds: number[]) {
    if (menuIds.length === 0) return false;
    const rows = await db
      .select({ id: storeMenus.storeId })
      .from(storeMenus)
      .where(inArray(storeMenus.menuId, menuIds))
      .limit(1);
    return rows.length > 0;
  },

  async deleteMenuWithRelations(menuIds: number[]) {
    await db.transaction(async (tx) => {
      const groups = await tx
        .select({ id: menuGroups.id })
        .from(menuGroups)
        .where(inArray(menuGroups.menuId, menuIds));

      const groupIds = groups.map(g => g.id);

      if (groupIds.length > 0) {
        await tx
          .delete(menuProducts)
          .where(inArray(menuProducts.groupId, groupIds));
      }

      await tx
        .delete(menuGroups)
        .where(inArray(menuGroups.menuId, menuIds));

      await tx
        .delete(menus)
        .where(inArray(menus.id, menuIds));
    });
  },

  // ─── 分组 ──────────────────────────────────────────

  async getMenuGroupList(menuId: number) {
    return db
      .select({
        id: menuGroups.id,
        menuId: menuGroups.menuId,
        name: menuGroups.name,
        sortOrder: menuGroups.sort,
        productCount: sql<number>`(select count(*) from ${menuProducts} where ${menuProducts.groupId} = ${menuGroups.id})`,
        createdAt: menuGroups.createdAt,
        updatedAt: menuGroups.updatedAt,
      })
      .from(menuGroups)
      .where(eq(menuGroups.menuId, menuId))
      .orderBy(menuGroups.sort, menuGroups.id);
  },

  async getMenuGroupById(id: number) {
    const rows = await db
      .select()
      .from(menuGroups)
      .where(eq(menuGroups.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async createMenuGroup(data: { menuId: number; name: string; sortOrder: number }) {
    const result = await db
      .insert(menuGroups)
      .values({ menuId: data.menuId, name: data.name, sort: data.sortOrder });
    return Number(result[0]?.insertId ?? 0);
  },

  async updateMenuGroupById(id: number, data: Partial<{ name: string; sortOrder: number }>) {
    const values: { name?: string; sort?: number } = {};
    if (data.name !== undefined) values.name = data.name;
    if (data.sortOrder !== undefined) values.sort = data.sortOrder;
    await db
      .update(menuGroups)
      .set(values)
      .where(eq(menuGroups.id, id));
  },

  async deleteMenuGroupWithProducts(groupId: number) {
    await db.transaction(async (tx) => {
      await tx
        .delete(menuProducts)
        .where(eq(menuProducts.groupId, groupId));

      await tx
        .delete(menuGroups)
        .where(eq(menuGroups.id, groupId));
    });
  },

  async batchDeleteMenuGroups(groupIds: number[]) {
    if (groupIds.length === 0) return;

    await db.transaction(async (tx) => {
      await tx
        .delete(menuProducts)
        .where(inArray(menuProducts.groupId, groupIds));

      await tx
        .delete(menuGroups)
        .where(inArray(menuGroups.id, groupIds));
    });
  },

  // ─── 商品 ──────────────────────────────────────────

  async getMenuProductList(groupId: number) {
    const rows = await db
      .select({
        groupId: menuProducts.groupId,
        productId: menuProducts.productId,
        productName: products.name,
        price: products.price,
        status: products.status,
        sortOrder: menuProducts.sort,
        createdAt: menuProducts.createdAt,
        updatedAt: menuProducts.updatedAt,
      })
      .from(menuProducts)
      .innerJoin(products, eq(menuProducts.productId, products.id))
      .where(eq(menuProducts.groupId, groupId))
      .orderBy(menuProducts.sort, menuProducts.productId);
    return rows.map((row) => ({ ...row, price: Number(row.price) }));
  },

  async getMenuProduct(groupId: number, productId: number) {
    const rows = await db
      .select({ productId: menuProducts.productId })
      .from(menuProducts)
      .where(
        and(
          eq(menuProducts.groupId, groupId),
          eq(menuProducts.productId, productId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async addMenuProduct(data: { groupId: number; productId: number; sortOrder: number }) {
    await db
      .insert(menuProducts)
      .values({ groupId: data.groupId, productId: data.productId, sort: data.sortOrder });
  },

  async batchRemoveMenuProducts(groupId: number, productIds: number[]) {
    if (productIds.length === 0) return;

    await db
      .delete(menuProducts)
      .where(
        and(
          eq(menuProducts.groupId, groupId),
          inArray(menuProducts.productId, productIds),
        ),
      );
  },

  async updateMenuProductSort(groupId: number, productId: number, sortOrder: number) {
    await db
      .update(menuProducts)
      .set({ sort: sortOrder })
      .where(
        and(
          eq(menuProducts.groupId, groupId),
          eq(menuProducts.productId, productId),
        ),
      );
  },

  // ─── 门店关联 ──────────────────────────────────────

  async getMenuStoreList(menuId: number, page: number, pageSize: number) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(storeMenus)
      .where(eq(storeMenus.menuId, menuId));

    const total = Number(countResult[0]?.count ?? 0);

    const items = await withPagination(
      db
        .select({
          id: stores.id,
          name: stores.name,
          province: stores.province,
          city: stores.city,
          district: stores.district,
          address: stores.address,
          status: stores.status,
          businessHours: stores.businessHours,
          phone: stores.phone,
          longitude: stores.longitude,
          latitude: stores.latitude,
          account: stores.account,
          email: stores.email,
          createdAt: stores.createdAt,
          updatedAt: stores.updatedAt,
        })
        .from(storeMenus)
        .innerJoin(stores, eq(storeMenus.storeId, stores.id))
        .where(eq(storeMenus.menuId, menuId))
        .orderBy(stores.id)
        .$dynamic(),
      page,
      pageSize,
    );

    return { items, total, page, pageSize };
  },

  async countStoresByArea(area: { province: string; city: string; district: string }) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stores)
      .where(buildAreaFilter(area));
    return Number(result?.count ?? 0);
  },

  async getUnboundStoreIdsByArea(menuId: number, area: { province: string; city: string; district: string }) {
    return db
      .select({ id: stores.id })
      .from(stores)
      .where(
        and(
          buildAreaFilter(area),
          sql`not exists (select 1 from ${storeMenus} where ${storeMenus.storeId} = ${stores.id} and ${storeMenus.menuId} = ${menuId})`,
        ),
      );
  },

  async getStoreIdsByIds(storeIds: number[]) {
    const rows = await db
      .select({ id: stores.id })
      .from(stores)
      .where(inArray(stores.id, storeIds));
    return rows.map(r => r.id);
  },

  async getBoundStoreIds(menuId: number, storeIds: number[]) {
    const rows = await db
      .select({ storeId: storeMenus.storeId })
      .from(storeMenus)
      .where(
        and(
          eq(storeMenus.menuId, menuId),
          inArray(storeMenus.storeId, storeIds),
        ),
      );
    return new Set(rows.map(r => r.storeId));
  },

  async insertStoreMenuRelations(values: { storeId: number; menuId: number }[]) {
    if (values.length === 0) return;
    await db.insert(storeMenus).values(values);
  },
};
