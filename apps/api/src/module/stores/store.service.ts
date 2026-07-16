import { nanoid } from 'nanoid';
import { BizError } from '@/common/exceptions/index.js';
import { StoreErrorCodes } from './store.errorcode.js';
import { storeRepository } from './store.repository.js';
import { redis } from '@/plugins/db/redis/index.js';
import { withDistributedLock } from '@/plugins/lock/index.js';
import { geocode } from '@/plugins/geocode/index.js';
import { codeToNames, getDivisionPath } from '@/utils';
import { hashPassword } from '@/plugins/password/index.js';
import { STORE_STATUS } from '@dextea-admin/contracts';
import type { StoreListRequest, CreateStoreRequest, UpdateStoreRequest, UpdateStoreBasicInfoRequest, UpdateStoreLocationRequest, UpdateStoreStatusRequest, BindStoreMenuRequest } from '@dextea-admin/contracts';

/** 将区域码反查得到的省/市/区拼成 JSON 数组字符串，如 ["广东省","广州市","番禺区"] */
function buildRegionName(regionCode?: string): string {
  const { province, city, district } = codeToNames(regionCode ?? '');
  return JSON.stringify([province, city, district].filter(Boolean));
}

/** 将库中存储的 JSON 字符串安全解析为名称数组 */
function parseRegionName(regionName?: string | null): string[] {
  if (!regionName) return [];
  try {
    const parsed = JSON.parse(regionName);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export const storeService = {
  async getStoreList(params: StoreListRequest) {
    const result = await storeRepository.getStoreList(params.page, params.pageSize, params.keyword);
    const items = result.items.map((store) => {
      const names = codeToNames(store.regionCode ?? '');
      return {
        ...store,
        regionName: parseRegionName(store.regionName),
        province: names.province,
        city: names.city,
        district: names.district,
      };
    });
    return { ...result, items };
  },

  async getStoreById(id: number) {
    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
    }
    return { ...store, regionName: parseRegionName(store.regionName) };
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
      regionName: buildRegionName(regionCode),
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
    if (regionCode !== undefined) {
      updateData.regionCode = regionCode;
      updateData.regionName = buildRegionName(regionCode);
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
    const { regionCode, address, longitude, latitude } = input;

    const store = await storeRepository.getStoreById(id);
    if (!store) {
      throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
    }

    await storeRepository.updateStoreById(id, {
      regionCode: regionCode ?? '',
      regionName: buildRegionName(regionCode),
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
