import type { MySql2Database } from 'drizzle-orm/mysql2';

type Db = MySql2Database<Record<string, unknown>>;
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { storesTable } from '../db/schema.js';
import { geocode } from '../utils/geocode.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../errorcode/index.js';
import { storeErrors } from '../errorcode/stores.js';
import {
  validateMaxLength,
  validatePhone,
  validateEmail,
  validateLongitude,
  validateLatitude,
} from '../utils/validation.js';
import type {
  PaginatedData,
  Store,
  CreateStoreInput,
  UpdateStoreInput,
  UpdateStoreBasicInfoRequest,
  UpdateStoreLocationRequest,
} from '@dextea/shared-types';
import { STORE_STATUS_VALUES } from '@dextea/shared-types';

// ─── Internal Types ─────────────────────────────────────

interface RedisClient {
  geoadd(key: string, longitude: number, latitude: number, member: string): Promise<number>;
  zrem(key: string, member: string): Promise<number>;
  del(key: string): Promise<number>;
}

export interface ListStoresParams {
  page: number;
  pageSize: number;
  keyword?: string;
}

export interface CreateStoreExtra {
  requestLogWarn: (obj: Record<string, unknown>, msg: string) => void;
  redis?: RedisClient;
}

export interface UpdateStoreLocationExtra {
  redis?: RedisClient;
}

export interface SyncStoreLocationsExtra {
  redis: RedisClient;
}

// ─── Service Functions ──────────────────────────────────

/**
 * 门店列表（分页 + 关键词搜索）
 */
export async function listStores(
  db: Db,
  params: ListStoresParams,
): Promise<PaginatedData<Store>> {
  try {
    const { page, pageSize, keyword } = params;
    const offset = (page - 1) * pageSize;

    let query = db
      .select()
      .from(storesTable)
      .$dynamic();

    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(storesTable)
      .$dynamic();

    if (keyword) {
      const pattern = `%${keyword}%`;
      const filter = sql`${storesTable.name} like ${pattern} or ${storesTable.phone} like ${pattern} or ${storesTable.address} like ${pattern}`;
      query = query.where(filter);
      countQuery = countQuery.where(filter);
    }

    const items = await query
      .limit(pageSize)
      .offset(offset)
      .orderBy(storesTable.id);

    const countResult = await countQuery;
    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(storeErrors.LIST_FAILED);
  }
}

/**
 * 门店详情
 */
export async function getStore(
  db: Db,
  id: number,
): Promise<Store> {
  try {
    const store = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.id, id))
      .limit(1);

    if (store.length === 0) {
      throw new AppError(storeErrors.STORE_NOT_FOUND);
    }

    return store[0];
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(storeErrors.GET_FAILED);
  }
}

/**
 * 新增门店（含地理编码 + Redis 定位同步）
 */
export async function createStore(
  db: Db,
  input: CreateStoreInput,
  extra: CreateStoreExtra,
): Promise<{ id: number; initialPassword: string }> {
  try {
    const { name, province, city, district, address, businessHours, phone, account, email } = input;
    const { requestLogWarn, redis } = extra;

    validateMaxLength(name, 255, '门店名称');
    validateMaxLength(account, 255, '登录账号');
    validateMaxLength(province, 100, '省份');
    validateMaxLength(city, 100, '城市');
    validateMaxLength(district, 100, '区县');
    validateMaxLength(address, 500, '详细地址');
    validatePhone(phone);
    validateEmail(email, '门店邮箱');

    const existingStore = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.account, account))
      .limit(1);

    if (existingStore.length > 0) {
      throw new AppError(storeErrors.ACCOUNT_EXISTS);
    }

    const coords = await geocode(province, city, district, address);
    const longitude = coords?.longitude ?? 0;
    const latitude = coords?.latitude ?? 0;

    if (!coords) {
      requestLogWarn(
        { address: [province, city, district, address].filter(Boolean).join('') },
        'Geocoding failed, using default coordinates',
      );
    }

    const initialPassword = nanoid(12);
    const hashedPassword = await hashPassword(initialPassword);

    const result = await db.insert(storesTable).values({
      name,
      province: province ?? '',
      city: city ?? '',
      district: district ?? '',
      address: address ?? '',
      businessHours: businessHours ?? '',
      phone: phone ?? '',
      account,
      password: hashedPassword,
      email: email ?? '',
      longitude,
      latitude,
    });

    const insertId = Number(result[0]?.insertId ?? 0);

    if (redis) {
      try {
        await redis.geoadd('dextea:store:location', longitude, latitude, String(insertId));
      } catch {
        // Redis failure is non-fatal
      }
    }

    return { id: insertId, initialPassword };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(storeErrors.CREATE_FAILED);
  }
}

/**
 * 全量更新门店
 */
export async function updateStore(
  db: Db,
  id: number,
  input: UpdateStoreInput,
): Promise<{ id: number }> {
  try {
    const { name, province, city, district, address, status, businessHours, phone, longitude, latitude } = input;

    validateMaxLength(name, 255, '门店名称');
    validateMaxLength(province, 100, '省份');
    validateMaxLength(city, 100, '城市');
    validateMaxLength(district, 100, '区县');
    validateMaxLength(address, 500, '详细地址');
    validatePhone(phone);

    const store = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.id, id))
      .limit(1);

    if (store.length === 0) {
      throw new AppError(storeErrors.STORE_NOT_FOUND);
    }

    await db
      .update(storesTable)
      .set({
        name,
        province,
        city,
        district,
        address,
        status,
        businessHours,
        phone,
        ...(longitude !== undefined ? { longitude } : {}),
        ...(latitude !== undefined ? { latitude } : {}),
      })
      .where(eq(storesTable.id, id));

    return { id };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(storeErrors.UPDATE_FAILED);
  }
}

/**
 * 更新门店基础信息（名称、电话、营业时间、邮箱）
 */
export async function updateStoreBasicInfo(
  db: Db,
  id: number,
  input: UpdateStoreBasicInfoRequest,
): Promise<{ id: number }> {
  try {
    const { name, phone, businessHours, email } = input;

    validateMaxLength(name, 255, '门店名称');
    validatePhone(phone);
    validateEmail(email, '门店邮箱');

    const store = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.id, id))
      .limit(1);

    if (store.length === 0) {
      throw new AppError(storeErrors.STORE_NOT_FOUND);
    }

    await db
      .update(storesTable)
      .set({ name, phone, businessHours, email: email ?? '' })
      .where(eq(storesTable.id, id));

    return { id };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(storeErrors.BASIC_INFO_UPDATE_FAILED);
  }
}

/**
 * 更新门店位置（含 Redis 定位数据同步）
 */
export async function updateStoreLocation(
  db: Db,
  id: number,
  input: UpdateStoreLocationRequest,
  extra: UpdateStoreLocationExtra,
): Promise<{ id: number }> {
  try {
    const { province, city, district, address, longitude, latitude } = input;
    const { redis } = extra;

    validateMaxLength(province, 100, '省份');
    validateMaxLength(city, 100, '城市');
    validateMaxLength(district, 100, '区县');
    validateMaxLength(address, 500, '详细地址');
    validateLongitude(longitude);
    validateLatitude(latitude);

    const store = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.id, id))
      .limit(1);

    if (store.length === 0) {
      throw new AppError(storeErrors.STORE_NOT_FOUND);
    }

    await db
      .update(storesTable)
      .set({ province, city, district, address, longitude, latitude })
      .where(eq(storesTable.id, id));

    if (redis) {
      try {
        await redis.zrem('dextea:store:location', String(id));
        if (longitude && latitude) {
          await redis.geoadd('dextea:store:location', longitude, latitude, String(id));
        }
      } catch {
        // Redis failure is non-fatal
      }
    }

    return { id };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(storeErrors.LOCATION_UPDATE_FAILED);
  }
}

/**
 * 更新门店状态
 */
export async function updateStoreStatus(
  db: Db,
  id: number,
  status: number,
): Promise<{ status: number }> {
  try {
    if (!STORE_STATUS_VALUES.includes(status)) {
      throw new AppError(storeErrors.INVALID_STATUS);
    }

    const store = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.id, id))
      .limit(1);

    if (store.length === 0) {
      throw new AppError(storeErrors.STORE_NOT_FOUND);
    }

    await db
      .update(storesTable)
      .set({ status })
      .where(eq(storesTable.id, id));

    return { status };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(storeErrors.STATUS_UPDATE_FAILED);
  }
}

/**
 * 重置门店密码
 */
export async function resetStorePassword(
  db: Db,
  id: number,
): Promise<{ newPassword: string }> {
  try {
    const store = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.id, id))
      .limit(1);

    if (store.length === 0) {
      throw new AppError(storeErrors.STORE_NOT_FOUND);
    }

    const newPassword = nanoid(12);
    const hashedPassword = await hashPassword(newPassword);

    await db
      .update(storesTable)
      .set({ password: hashedPassword })
      .where(eq(storesTable.id, id));

    return { newPassword };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(storeErrors.RESET_PASSWORD_FAILED);
  }
}

/**
 * 同步所有门店定位数据到 Redis
 */
export async function syncStoreLocations(
  db: Db,
  extra: SyncStoreLocationsExtra,
): Promise<{ synced: number }> {
  try {
    const { redis } = extra;

    await redis.del('dextea:store:location');

    const stores = await db
      .select({ id: storesTable.id, longitude: storesTable.longitude, latitude: storesTable.latitude })
      .from(storesTable);

    let synced = 0;
    for (const store of stores) {
      if (store.longitude && store.latitude) {
        await redis.geoadd('dextea:store:location', store.longitude, store.latitude, String(store.id));
        synced++;
      }
    }

    return { synced };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(storeErrors.SYNC_FAILED);
  }
}
