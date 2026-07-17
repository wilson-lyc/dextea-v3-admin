import { nanoid } from 'nanoid';
import { BizError } from '@/common/exceptions/index.js';
import { StoreErrorCodes } from './store.errorcode.js';
import { storeRepository } from './store.repository.js';
import { redis } from '@/plugins/db/redis/index.js';
import { withDistributedLock } from '@/plugins/lock/index.js';
import { geocode } from '@/plugins/geocode/index.js';
import { hashPassword } from '@/plugins/password/index.js';
import { normalizeStoreRegion, isMunicipality } from '@/utils';
import { STORE_STATUS } from '@dextea-admin/contracts';
import type { StoreListRequest, CreateStoreRequest, UpdateStoreRequest, UpdateStoreBasicInfoRequest, UpdateStoreLocationRequest, UpdateStoreStatusRequest, BindStoreMenuRequest } from '@dextea-admin/contracts';

export const storeService = {
  async getStoreList(params: StoreListRequest) {
    return storeRepository.getStoreList(params.page, params.pageSize, params.keyword);
  },

  async getStoreById(id: number) {
    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
    }
    return store;
  },

  async createStore(input: CreateStoreRequest) {
    const { name, province, city, district, address, businessHours, phone, account, email } = input;

    const existing = await storeRepository.getStoreByAccount(account ?? '');
    if (existing) {
      throw new BizError(StoreErrorCodes.ACCOUNT_EXISTS);
    }

    const region = normalizeStoreRegion({ province, city, district });

    const coords = await geocode(region.province, region.city, region.district, address ?? '');
    const longitude = coords?.longitude ?? 0;
    const latitude = coords?.latitude ?? 0;

    if (!coords) {
      console.warn(`Geocoding failed for ${[region.province, region.city, region.district, address].filter(Boolean).join('')}`);
    }

    const initialPassword = nanoid(12);
    const hashedPassword = await hashPassword(initialPassword);

    const id = await storeRepository.createStore({
      name,
      province: region.province,
      city: region.city,
      district: region.district,
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
    const { name, province, city, district, address, status, businessHours, phone, longitude, latitude } = input;

    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
    }

    const region = normalizeStoreRegion({ province, city, district });

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (province !== undefined) updateData.province = region.province;
    // 直辖市时即便仅传入省，也需把市名列补为直辖市名（省列置空）
    if (city !== undefined || (province !== undefined && isMunicipality(province))) {
      updateData.city = region.city;
    }
    // 直辖市省市区三列联动，避免区列残留旧值
    if (district !== undefined || (province !== undefined && isMunicipality(province))) {
      updateData.district = region.district;
    }
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
    const { province, city, district, address, longitude, latitude } = input;

    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
    }

    const region = normalizeStoreRegion({ province, city, district });

    await storeRepository.updateStoreById(id, {
      province: region.province,
      city: region.city,
      district: region.district,
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

    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
    }

    return withDistributedLock(`store:status:${id}`, async () => {
      await storeRepository.updateStoreById(id, { status });
      return { status };
    });
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

};
