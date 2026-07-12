import { nanoid } from 'nanoid';
import { BizError } from '@/common/exceptions/index.js';
import { StoreErrorCodes } from './store.errorcode.js';
import { storeRepository } from './store.repository.js';
import { redis } from '@/plugins/db/redis/index.js';
import { withDistributedLock } from '@/plugins/utils/distributed-lock.js';
import { geocode } from '@/plugins/utils/geocode.js';
import { codeToNames } from '@/plugins/utils/area-code.js';
import { hashPassword } from '@/plugins/utils/password.js';
import { STORE_STATUS, STORE_STATUS_VALUES } from '@dextea-admin/contracts';
import type { StoreListRequest, CreateStoreRequest, UpdateStoreRequest, UpdateStoreBasicInfoRequest, UpdateStoreLocationRequest, UpdateStoreStatusRequest, BindStoreMenuRequest } from '@dextea-admin/contracts';

export const storeService = {
  async getStoreList(params: StoreListRequest) {
    const result = await storeRepository.getStoreList(params.page, params.pageSize, params.keyword);
    const items = result.items.map((store) => {
      const names = codeToNames(store.regionCode ?? '');
      return { ...store, province: names.province, city: names.city, district: names.district };
    });
    return { ...result, items };
  },

  async getStoreById(id: number) {
    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
    }
    return store;
  },

  async createStore(input: CreateStoreRequest) {
    const { name, regionCode, address, businessHours, phone, account, email } = input;

    const existing = await storeRepository.getStoreByAccount(account ?? '');
    if (existing) {
      throw new BizError(StoreErrorCodes.ACCOUNT_EXISTS);
    }

    const areaNames = codeToNames(regionCode ?? '');
    const coords = await geocode(areaNames.province, areaNames.city, areaNames.district, address ?? '');
    const longitude = coords?.longitude ?? 0;
    const latitude = coords?.latitude ?? 0;

    if (!coords) {
      console.warn(`Geocoding failed for ${[areaNames.province, areaNames.city, areaNames.district, address].filter(Boolean).join('')}`);
    }

    const initialPassword = nanoid(12);
    const hashedPassword = await hashPassword(initialPassword);

    const id = await storeRepository.createStore({
      name,
      regionCode: regionCode ?? '',
      address: address ?? '',
      status: STORE_STATUS.PREPARING.value,
      businessHours: businessHours ?? '',
      phone: phone ?? '',
      account,
      password: hashedPassword,
      email: email ?? '',
      longitude,
      latitude,
    });

    await redis.geoadd('dextea:store:location', longitude, latitude, String(id));

    return { id, initialPassword };
  },

  async updateStore(id: number, input: UpdateStoreRequest) {
    const { name, regionCode, address, status, businessHours, phone, longitude, latitude } = input;

    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (regionCode !== undefined) updateData.regionCode = regionCode;
    if (address !== undefined) updateData.address = address;
    if (status !== undefined) updateData.status = status;
    if (businessHours !== undefined) updateData.businessHours = businessHours;
    if (phone !== undefined) updateData.phone = phone;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (latitude !== undefined) updateData.latitude = latitude;

    await storeRepository.updateStoreById(id, updateData);

    return { id };
  },

  async updateStoreBasicInfo(id: number, input: UpdateStoreBasicInfoRequest) {
    const { name, phone, businessHours, email } = input;

    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
    }

    await storeRepository.updateStoreById(id, {
      name,
      phone: phone ?? '',
      businessHours: businessHours ?? '',
      email: email ?? '',
    });

    return { id };
  },

  async updateStoreLocation(id: number, input: UpdateStoreLocationRequest) {
    const { regionCode, address, longitude, latitude } = input;

    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
    }

    await storeRepository.updateStoreById(id, {
      regionCode: regionCode ?? '',
      address: address ?? '',
      longitude,
      latitude,
    });

    await redis.zrem('dextea:store:location', String(id));
    if (longitude && latitude) {
      await redis.geoadd('dextea:store:location', longitude, latitude, String(id));
    }

    return { id };
  },

  async updateStoreStatus(id: number, input: UpdateStoreStatusRequest) {
    const { status } = input;

    if (!STORE_STATUS_VALUES.includes(status as 0 | 1 | 2 | 3)) {
      throw new BizError(StoreErrorCodes.INVALID_STATUS);
    }

    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
    }

    await storeRepository.updateStoreById(id, { status });

    return { status };
  },

  async resetStorePassword(id: number) {
    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
    }

    const newPassword = nanoid(12);
    const hashedPassword = await hashPassword(newPassword);

    await storeRepository.updateStoreById(id, { password: hashedPassword });

    return { newPassword };
  },

  async syncStoreLocations() {
    await redis.del('dextea:store:location');

    const stores = await storeRepository.getAllStoreLocations();

    let synced = 0;
    for (const store of stores) {
      if (store.longitude && store.latitude) {
        await redis.geoadd('dextea:store:location', store.longitude, store.latitude, String(store.id));
        synced++;
      }
    }

    return { synced };
  },

  async bindStoreMenu(storeId: number, input: BindStoreMenuRequest) {
    const { menuId } = input;

    const store = await storeRepository.getStoreById(storeId);
    if (!store) {
      throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
    }

    if (menuId !== null) {
      const menu = await storeRepository.getMenuById(menuId);
      if (!menu) {
        throw new BizError(StoreErrorCodes.MENU_NOT_FOUND);
      }
    }

    await storeRepository.deleteStoreMenuRelations(storeId);

    if (menuId !== null) {
      await storeRepository.insertStoreMenuRelation(storeId, menuId);
    }

    return { id: storeId };
  },

  // ─── 门店目录子资源（商品/客制化/原料的门店级覆盖） ───

  async listStoreProducts(
    storeId: number,
    params: { page: number; pageSize: number; globalStatus?: number; storeStatus?: number },
  ) {
    await ensureStoreExists(storeId);
    return storeRepository.listStoreProducts(storeId, params);
  },

  async upsertProductStoreStatus(storeId: number, productId: number, status: number) {
    await ensureStoreExists(storeId);
    await storeRepository.upsertProductStoreStatus(storeId, productId, status);
  },

  async listStoreCustomizations(storeId: number, params: { page: number; pageSize: number }) {
    await ensureStoreExists(storeId);
    return storeRepository.listStoreCustomizations(storeId, params);
  },

  async listStoreCustomizationOptions(
    storeId: number,
    customizationId: number,
    params: { page: number; pageSize: number },
  ) {
    await ensureStoreExists(storeId);
    return storeRepository.listStoreCustomizationOptions(storeId, customizationId, params);
  },

  async upsertCustomizationOptionStoreStatus(storeId: number, optionId: number, status: number) {
    await ensureStoreExists(storeId);
    // 锁按 (门店, 客制化选项) 维度，避免并发修改同一门店内的客制化选项状态造成覆盖。
    return withDistributedLock(`store:customization-option:${storeId}:${optionId}`, async () => {
      await storeRepository.upsertCustomizationOptionStoreStatus(storeId, optionId, status);
    });
  },

  async listStoreIngredients(storeId: number, params: { page: number; pageSize: number }) {
    await ensureStoreExists(storeId);
    return storeRepository.listStoreIngredients(storeId, params);
  },

  async updateStoreIngredientStock(storeId: number, ingredientId: number, quantity: number) {
    await ensureStoreExists(storeId);
    // 锁按 (门店, 原料) 维度，仅持有锁者可更新该门店的原料库存，
    // 未取得锁直接抛出 LOCK_CONFLICT（请稍后重试）。
    return withDistributedLock(`store:ingredient:stock:${storeId}:${ingredientId}`, async () => {
      await storeRepository.updateStoreIngredientQuantity(storeId, ingredientId, quantity);
      return { id: ingredientId, quantity };
    });
  },
};
