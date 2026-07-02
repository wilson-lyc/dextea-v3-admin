import type { MySql2Database } from 'drizzle-orm/mysql2';

type Db = MySql2Database<Record<string, unknown>>;
import { and, eq, inArray, sql } from 'drizzle-orm';
import { menusTable, menuGroupsTable, menuProductsTable, productsTable, storesTable } from '../db/schema.js';
import { AppError } from '../errorcode/index.js';
import { menuErrors } from '../errorcode/menus.js';
import { productErrors } from '../errorcode/products.js';
import { storeErrors } from '../errorcode/stores.js';
import { validateMaxLength } from '../utils/validation.js';
import { withPagination } from '../utils/pagination.js';
import type { PaginatedData, Menu, MenuGroup, MenuProduct, CreateMenuInput, UpdateMenuInput, CreateMenuGroupInput, UpdateMenuGroupInput } from '@dextea/shared-types';

export async function listMenus(
  db: Db,
  params: { page: number; pageSize: number },
): Promise<PaginatedData<Menu>> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(menusTable);

  const total = Number(countResult[0]?.count ?? 0);

  const items = await withPagination(
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
  );

  return { items, total, page, pageSize };
}

export async function createMenu(
  db: Db,
  input: CreateMenuInput,
): Promise<{ id: number }> {
  const { name, description } = input;

  if (!name || name.trim().length === 0) {
    throw new AppError(menuErrors.NAME_REQUIRED);
  }

  const trimmedName = name.trim();
  validateMaxLength(trimmedName, 255, '菜单名称');

  const trimmedDescription = description?.trim() ?? '';
  validateMaxLength(trimmedDescription, 500, '菜单描述');

  const result = await db
    .insert(menusTable)
    .values({ name: trimmedName, description: trimmedDescription });

  const insertId = Number(result[0]?.insertId ?? 0);

  return { id: insertId };
}

export async function getMenu(
  db: Db,
  id: number,
): Promise<Menu> {
  const [menu] = await db
    .select({
      id: menusTable.id,
      name: menusTable.name,
      description: menusTable.description,
      createdAt: menusTable.createdAt,
      updatedAt: menusTable.updatedAt,
    })
    .from(menusTable)
    .where(eq(menusTable.id, id))
    .limit(1);

  if (!menu) {
    throw new AppError(menuErrors.MENU_NOT_FOUND);
  }

  return menu;
}

export async function updateMenu(
  db: Db,
  id: number,
  input: UpdateMenuInput,
): Promise<{ id: number }> {
  const [menu] = await db
    .select()
    .from(menusTable)
    .where(eq(menusTable.id, id))
    .limit(1);

  if (!menu) {
    throw new AppError(menuErrors.MENU_NOT_FOUND);
  }

  const values: Partial<{ name: string; description: string }> = {};

  if (input.name !== undefined) {
    const trimmedName = input.name.trim();
    if (trimmedName.length === 0) {
      throw new AppError(menuErrors.NAME_REQUIRED);
    }
    validateMaxLength(trimmedName, 255, '菜单名称');
    values.name = trimmedName;
  }

  if (input.description !== undefined) {
    const trimmedDescription = input.description.trim();
    validateMaxLength(trimmedDescription, 500, '菜单描述');
    values.description = trimmedDescription;
  }

  if (Object.keys(values).length > 0) {
    await db
      .update(menusTable)
      .set(values)
      .where(eq(menusTable.id, id));
  }

  return { id };
}

export async function deleteMenu(
  db: Db,
  id: number,
): Promise<void> {
  const [menu] = await db
    .select()
    .from(menusTable)
    .where(eq(menusTable.id, id))
    .limit(1);

  if (!menu) {
    throw new AppError(menuErrors.MENU_NOT_FOUND);
  }

  const boundStores = await db
    .select({ id: storesTable.id })
    .from(storesTable)
    .where(eq(storesTable.menuId, id))
    .limit(1);

  if (boundStores.length > 0) {
    throw new AppError(menuErrors.MENU_IN_USE);
  }

  const groups = await db
    .select({ id: menuGroupsTable.id })
    .from(menuGroupsTable)
    .where(eq(menuGroupsTable.menuId, id));

  const groupIds = groups.map(g => g.id);

  if (groupIds.length > 0) {
    await db
      .delete(menuProductsTable)
      .where(inArray(menuProductsTable.groupId, groupIds));
  }

  await db
    .delete(menuGroupsTable)
    .where(eq(menuGroupsTable.menuId, id));

  await db
    .delete(menusTable)
    .where(eq(menusTable.id, id));
}

export async function batchDeleteMenus(
  db: Db,
  menuIds: number[],
): Promise<void> {
  if (menuIds.length === 0) return;

  const boundStores = await db
    .select({ id: storesTable.id })
    .from(storesTable)
    .where(inArray(storesTable.menuId, menuIds))
    .limit(1);

  if (boundStores.length > 0) {
    throw new AppError(menuErrors.MENU_IN_USE);
  }

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
}

export async function listMenuGroups(
  db: Db,
  menuId: number,
): Promise<MenuGroup[]> {
  const [menu] = await db
    .select()
    .from(menusTable)
    .where(eq(menusTable.id, menuId))
    .limit(1);

  if (!menu) {
    throw new AppError(menuErrors.MENU_NOT_FOUND);
  }

  const items = await db
    .select({
      id: menuGroupsTable.id,
      menuId: menuGroupsTable.menuId,
      name: menuGroupsTable.name,
      sortOrder: menuGroupsTable.sortOrder,
      productCount: sql<number>`(select count(*) from ${menuProductsTable} where ${menuProductsTable.groupId} = ${menuGroupsTable.id})`,
      createdAt: menuGroupsTable.createdAt,
      updatedAt: menuGroupsTable.updatedAt,
    })
    .from(menuGroupsTable)
    .where(eq(menuGroupsTable.menuId, menuId))
    .orderBy(menuGroupsTable.sortOrder, menuGroupsTable.id);

  return items;
}

export async function createMenuGroup(
  db: Db,
  input: CreateMenuGroupInput,
): Promise<{ id: number }> {
  const { menuId, name, sortOrder } = input;

  const [menu] = await db
    .select()
    .from(menusTable)
    .where(eq(menusTable.id, menuId))
    .limit(1);

  if (!menu) {
    throw new AppError(menuErrors.MENU_NOT_FOUND);
  }

  if (!name || name.trim().length === 0) {
    throw new AppError(menuErrors.NAME_REQUIRED);
  }

  const trimmedName = name.trim();
  validateMaxLength(trimmedName, 255, '分组名称');

  const result = await db
    .insert(menuGroupsTable)
    .values({ menuId, name: trimmedName, sortOrder: sortOrder ?? 0 });

  const insertId = Number(result[0]?.insertId ?? 0);

  return { id: insertId };
}

export async function updateMenuGroup(
  db: Db,
  id: number,
  input: UpdateMenuGroupInput,
): Promise<{ id: number }> {
  const [group] = await db
    .select()
    .from(menuGroupsTable)
    .where(eq(menuGroupsTable.id, id))
    .limit(1);

  if (!group) {
    throw new AppError(menuErrors.GROUP_NOT_FOUND);
  }

  const values: Partial<{ name: string; sortOrder: number }> = {};

  if (input.name !== undefined) {
    const trimmedName = input.name.trim();
    if (trimmedName.length === 0) {
      throw new AppError(menuErrors.NAME_REQUIRED);
    }
    validateMaxLength(trimmedName, 255, '分组名称');
    values.name = trimmedName;
  }

  if (input.sortOrder !== undefined) {
    values.sortOrder = input.sortOrder;
  }

  if (Object.keys(values).length > 0) {
    await db
      .update(menuGroupsTable)
      .set(values)
      .where(eq(menuGroupsTable.id, id));
  }

  return { id };
}

export async function deleteMenuGroup(
  db: Db,
  id: number,
): Promise<void> {
  const [group] = await db
    .select()
    .from(menuGroupsTable)
    .where(eq(menuGroupsTable.id, id))
    .limit(1);

  if (!group) {
    throw new AppError(menuErrors.GROUP_NOT_FOUND);
  }

  await db
    .delete(menuProductsTable)
    .where(eq(menuProductsTable.groupId, id));

  await db
    .delete(menuGroupsTable)
    .where(eq(menuGroupsTable.id, id));
}

export async function batchDeleteMenuGroups(
  db: Db,
  groupIds: number[],
): Promise<void> {
  if (groupIds.length === 0) return;

  await db.transaction(async (tx) => {
    await tx
      .delete(menuProductsTable)
      .where(inArray(menuProductsTable.groupId, groupIds));

    await tx
      .delete(menuGroupsTable)
      .where(inArray(menuGroupsTable.id, groupIds));
  });
}

export async function listMenuProducts(
  db: Db,
  groupId: number,
): Promise<MenuProduct[]> {
  const [group] = await db
    .select()
    .from(menuGroupsTable)
    .where(eq(menuGroupsTable.id, groupId))
    .limit(1);

  if (!group) {
    throw new AppError(menuErrors.GROUP_NOT_FOUND);
  }

  const items = await db
    .select({
      groupId: menuProductsTable.groupId,
      productId: menuProductsTable.productId,
      productName: productsTable.name,
      price: productsTable.price,
      status: productsTable.status,
      sortOrder: menuProductsTable.sortOrder,
      createdAt: menuProductsTable.createdAt,
      updatedAt: menuProductsTable.updatedAt,
    })
    .from(menuProductsTable)
    .innerJoin(productsTable, eq(menuProductsTable.productId, productsTable.id))
    .where(eq(menuProductsTable.groupId, groupId))
    .orderBy(menuProductsTable.sortOrder, menuProductsTable.productId);

  return items;
}

export async function addMenuProduct(
  db: Db,
  groupId: number,
  productId: number,
  sortOrder: number,
): Promise<{ bound: boolean }> {
  const [group] = await db
    .select()
    .from(menuGroupsTable)
    .where(eq(menuGroupsTable.id, groupId))
    .limit(1);

  if (!group) {
    throw new AppError(menuErrors.GROUP_NOT_FOUND);
  }

  const [existingProduct] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.id, productId))
    .limit(1);

  if (!existingProduct) {
    throw new AppError(productErrors.PRODUCT_NOT_FOUND);
  }

  const [existingBinding] = await db
    .select({ productId: menuProductsTable.productId })
    .from(menuProductsTable)
    .where(
      and(
        eq(menuProductsTable.groupId, groupId),
        eq(menuProductsTable.productId, productId),
      ),
    )
    .limit(1);

  if (existingBinding) {
    return { bound: false };
  }

  await db.insert(menuProductsTable).values({
    groupId,
    productId,
    sortOrder,
  });

  return { bound: true };
}

export async function batchRemoveMenuProducts(
  db: Db,
  groupId: number,
  productIds: number[],
): Promise<void> {
  if (productIds.length === 0) return;

  await db
    .delete(menuProductsTable)
    .where(
      and(
        eq(menuProductsTable.groupId, groupId),
        inArray(menuProductsTable.productId, productIds),
      ),
    );
}

export async function updateMenuProductSort(
  db: Db,
  groupId: number,
  productId: number,
  sortOrder: number,
): Promise<void> {
  const [group] = await db
    .select()
    .from(menuGroupsTable)
    .where(eq(menuGroupsTable.id, groupId))
    .limit(1);

  if (!group) {
    throw new AppError(menuErrors.GROUP_NOT_FOUND);
  }

  const [existing] = await db
    .select({ productId: menuProductsTable.productId })
    .from(menuProductsTable)
    .where(
      and(
        eq(menuProductsTable.groupId, groupId),
        eq(menuProductsTable.productId, productId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new AppError(menuErrors.PRODUCT_NOT_BOUND);
  }

  await db
    .update(menuProductsTable)
    .set({ sortOrder })
    .where(
      and(
        eq(menuProductsTable.groupId, groupId),
        eq(menuProductsTable.productId, productId),
      ),
    );
}

export async function bindStoreMenu(
  db: Db,
  storeId: number,
  menuId: number | null,
): Promise<{ id: number; menuId: number | null }> {
  try {
    const store = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.id, storeId))
      .limit(1);

    if (store.length === 0) {
      throw new AppError(storeErrors.STORE_NOT_FOUND);
    }

    if (menuId !== null) {
      const menu = await db
        .select()
        .from(menusTable)
        .where(eq(menusTable.id, menuId))
        .limit(1);

      if (menu.length === 0) {
        throw new AppError(menuErrors.MENU_NOT_FOUND);
      }
    }

    await db
      .update(storesTable)
      .set({ menuId })
      .where(eq(storesTable.id, storeId));

    return { id: storeId, menuId };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(menuErrors.UPDATE_FAILED);
  }
}
