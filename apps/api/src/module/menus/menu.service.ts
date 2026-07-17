import { BizError } from '@/common/exceptions/index.js';
import { MenuErrorCodes } from './menu.errorcode.js';
import { menuRepository } from './menu.repository.js';
import { normalizeStoreRegion } from '@/utils';
import type {
  MenuListRequest,
  CreateMenuRequest,
  UpdateMenuRequest,
  BatchDeleteMenusRequest,
  CreateMenuGroupRequest,
  UpdateMenuGroupRequest,
  BatchDeleteMenuGroupsRequest,
  AddMenuProductRequest,
  BatchRemoveMenuProductsRequest,
  UpdateMenuProductSortRequest,
  MenuStoreListRequest,
  DispatchByAreaRequest,
  DispatchByIdRequest,
} from '@dextea-admin/contracts';

export const menuService = {
  // ─── 菜单 ──────────────────────────────────────────

  async getMenuList(params: MenuListRequest) {
    return menuRepository.getMenuList(params.page, params.pageSize);
  },

  async getMenuById(id: number) {
    const menu = await menuRepository.getMenuById(id);
    if (!menu) {
      throw new BizError(MenuErrorCodes.MENU_NOT_FOUND);
    }
    return menu;
  },

  async createMenu(input: CreateMenuRequest) {
    const { name, description } = input;
    const id = await menuRepository.createMenu({
      name: name.trim(),
      description: (description ?? '').trim(),
    });
    return { id };
  },

  async updateMenu(id: number, input: UpdateMenuRequest) {
    const menu = await menuRepository.getMenuById(id);
    if (!menu) {
      throw new BizError(MenuErrorCodes.MENU_NOT_FOUND);
    }

    const values: Record<string, string> = {};
    if (input.name !== undefined) {
      values.name = input.name.trim();
    }
    if (input.description !== undefined) {
      values.description = input.description.trim();
    }

    if (Object.keys(values).length > 0) {
      await menuRepository.updateMenuById(id, values);
    }

    return { id };
  },

  async batchDeleteMenus(input: BatchDeleteMenusRequest) {
    const { menuIds } = input;

    const hasBound = await menuRepository.hasBoundStores(menuIds);
    if (hasBound) {
      throw new BizError(MenuErrorCodes.MENU_IN_USE);
    }

    await menuRepository.deleteMenuWithRelations(menuIds);
  },

  // ─── 分组 ──────────────────────────────────────────

  async getMenuGroupList(menuId: number) {
    const menu = await menuRepository.getMenuById(menuId);
    if (!menu) {
      throw new BizError(MenuErrorCodes.MENU_NOT_FOUND);
    }

    return menuRepository.getMenuGroupList(menuId);
  },

  async createMenuGroup(menuId: number, input: CreateMenuGroupRequest) {
    const menu = await menuRepository.getMenuById(menuId);
    if (!menu) {
      throw new BizError(MenuErrorCodes.MENU_NOT_FOUND);
    }

    const { name, sortOrder } = input;
    const id = await menuRepository.createMenuGroup({
      menuId,
      name: name.trim(),
      sortOrder: sortOrder ?? 0,
    });
    return { id };
  },

  async updateMenuGroup(id: number, input: UpdateMenuGroupRequest) {
    const group = await menuRepository.getMenuGroupById(id);
    if (!group) {
      throw new BizError(MenuErrorCodes.GROUP_NOT_FOUND);
    }

    const values: Record<string, string | number> = {};
    if (input.name !== undefined) {
      values.name = input.name.trim();
    }
    if (input.sortOrder !== undefined) {
      values.sortOrder = input.sortOrder;
    }

    if (Object.keys(values).length > 0) {
      await menuRepository.updateMenuGroupById(id, values);
    }

    return { id };
  },

  async batchDeleteMenuGroups(input: BatchDeleteMenuGroupsRequest) {
    const { groupIds } = input;
    await menuRepository.batchDeleteMenuGroups(groupIds);
  },

  // ─── 商品 ──────────────────────────────────────────

  async getMenuProductList(groupId: number) {
    const group = await menuRepository.getMenuGroupById(groupId);
    if (!group) {
      throw new BizError(MenuErrorCodes.GROUP_NOT_FOUND);
    }

    return menuRepository.getMenuProductList(groupId);
  },

  async addMenuProduct(groupId: number, input: AddMenuProductRequest) {
    const { productId, sortOrder = 0 } = input;

    const group = await menuRepository.getMenuGroupById(groupId);
    if (!group) {
      throw new BizError(MenuErrorCodes.GROUP_NOT_FOUND);
    }

    const existing = await menuRepository.getMenuProduct(groupId, productId);
    if (existing) {
      throw new BizError(MenuErrorCodes.PRODUCT_ALREADY_BOUND);
    }

    await menuRepository.addMenuProduct({ groupId, productId, sortOrder });
  },

  async batchRemoveMenuProducts(groupId: number, input: BatchRemoveMenuProductsRequest) {
    const { productIds } = input;

    const group = await menuRepository.getMenuGroupById(groupId);
    if (!group) {
      throw new BizError(MenuErrorCodes.GROUP_NOT_FOUND);
    }

    await menuRepository.batchRemoveMenuProducts(groupId, productIds);
  },

  async updateMenuProductSort(groupId: number, input: UpdateMenuProductSortRequest) {
    const { productId, sortOrder } = input;

    const group = await menuRepository.getMenuGroupById(groupId);
    if (!group) {
      throw new BizError(MenuErrorCodes.GROUP_NOT_FOUND);
    }

    const existing = await menuRepository.getMenuProduct(groupId, productId);
    if (!existing) {
      throw new BizError(MenuErrorCodes.PRODUCT_NOT_BOUND);
    }

    await menuRepository.updateMenuProductSort(groupId, productId, sortOrder);
  },

  // ─── 门店关联 ──────────────────────────────────────

  async getMenuStoreList(menuId: number, params: MenuStoreListRequest) {
    const menu = await menuRepository.getMenuById(menuId);
    if (!menu) {
      throw new BizError(MenuErrorCodes.MENU_NOT_FOUND);
    }

    return menuRepository.getMenuStoreList(menuId, params.page, params.pageSize);
  },

  async dispatchByArea(menuId: number, input: DispatchByAreaRequest) {
    const menu = await menuRepository.getMenuById(menuId);
    if (!menu) {
      throw new BizError(MenuErrorCodes.MENU_NOT_FOUND);
    }

    const { province, city, district } = input;
    if (!province) {
      throw new BizError(MenuErrorCodes.INVALID_REGION_CODE);
    }

    // 归一化为门店存储格式后再匹配（直辖市整体后移一位，与门店入库口径一致）
    const area = normalizeStoreRegion({ province, city: city ?? '', district: district ?? '' });
    // 展示名称按用户实际选择的层级拼接（选择器对直辖市把区放在 city 位）
    const regionName = [province, city, district].filter(Boolean).join('');

    const matched = await menuRepository.countStoresByArea(area);

    if (matched === 0) {
      throw new BizError(MenuErrorCodes.NO_MATCHED_STORES);
    }

    const unboundStores = await menuRepository.getUnboundStoreIdsByArea(menuId, area);

    if (unboundStores.length === 0) {
      return { matched, dispatched: 0, regionName };
    }

    const values = unboundStores.map(s => ({ storeId: s.id, menuId }));
    await menuRepository.insertStoreMenuRelations(values);

    return { matched, dispatched: unboundStores.length, regionName };
  },

  async dispatchById(menuId: number, input: DispatchByIdRequest) {
    const menu = await menuRepository.getMenuById(menuId);
    if (!menu) {
      throw new BizError(MenuErrorCodes.MENU_NOT_FOUND);
    }

    const { storeIds } = input;
    const existingStoreIds = await menuRepository.getStoreIdsByIds(storeIds);

    if (existingStoreIds.length === 0) {
      throw new BizError(MenuErrorCodes.NO_MATCHED_STORES);
    }

    const boundIds = await menuRepository.getBoundStoreIds(menuId, existingStoreIds);
    const toBindIds = existingStoreIds.filter(id => !boundIds.has(id));

    if (toBindIds.length > 0) {
      const values = toBindIds.map(storeId => ({ storeId, menuId }));
      await menuRepository.insertStoreMenuRelations(values);
    }

    return { matched: existingStoreIds.length, dispatched: toBindIds.length };
  },
};
