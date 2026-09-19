import { BizError } from '@/common/exceptions/index.js';
import { StoreErrorCodes } from './store.errorcode.js';
import { storeRepository } from './store.repository.js';
import { redis } from '@/plugins/db/redis/index.js';
import { geocode } from '@/plugins/geocode/index.js';
import { normalizeStoreRegion } from '@/utils';
import { STORE_STATUS } from '@dextea-admin/contracts';
import type { StoreListRequest, CreateStoreRequest, UpdateStoreProfileRequest, UpdateStoreLocationRequest, UpdateStoreStatusRequest } from '@dextea-admin/contracts';

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

    const result = await storeRepository.createStore({
      name,
      province: region.province,
      city: region.city,
      district: region.district,
      address: address ?? '',
      status: STORE_STATUS.PENDING.value,
      businessHours: businessHours ?? '',
      phone: phone ?? '',
      account,
      email: email ?? '',
      longitude,
      latitude,
    });

    if (longitude !== 0 || latitude !== 0) {
      await redis.geoadd('dextea:store:location', longitude, latitude, String(result.id));
    }

    return { initialPassword: result.initialPassword };
  },

  async updateStoreBasicInfo(id: number, input: UpdateStoreProfileRequest) {
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

    await storeRepository.updateStoreById(id, { status });
    return { status };
  },

  async resetStorePassword(id: number) {
    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
    }

    const { callRpc } = await import('@/infrastructure/rpc/client.js');
    const result = await callRpc<{ password: string }>('storeAdmin', 'resetStorePassword', { id });
    return { newPassword: result.password };
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

};
