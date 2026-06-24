import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '../db/index.js';
import { storesTable } from '../db/schema.js';
import { geocode } from '../utils/geocode.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../errorcode/index.js';
import { storeErrors } from '../errorcode/stores.js';
import type {
  ApiResponse,
  PaginatedData,
  Store,
  StoreQuery,
  CreateStoreInput,
  CreateStoreResponse,
  UpdateStoreInput,
  UpdateStoreResponse,
  UpdateStoreStatusRequest,
  UpdateStoreStatusResponse,
  UpdateStoreBasicInfoRequest,
  UpdateStoreBasicInfoResponse,
  UpdateStoreLocationRequest,
  UpdateStoreLocationResponse,
  ResetStorePasswordResponse,
} from '@dextea/shared-types';
import {
  STORE_STATUS_LABEL,
  STORE_STATUS_VALUES,
} from '@dextea/shared-types';

export async function storeRoutes(app: FastifyInstance) {
  /**
   * 门店列表
   * url：/api/v1/stores
   */
  app.get<{
    Querystring: StoreQuery;
    Reply: ApiResponse<PaginatedData<Store>>;
  }>('/stores', async (request, reply) => {
    try {
      const db = await getDb();
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;
      const keyword = request.query.keyword;

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

      return {
        code: 0,
        data: { items, total, page, pageSize },
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.LIST_FAILED);
    }
  });

  /**
   * 门店详情
   * url：/api/v1/stores/:id
   */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<Store>;
  }>('/stores/:id', async (request, reply) => {
    try {
      const db = await getDb();
      const id = parseInt(request.params.id, 10);

      const store = await db
        .select()
        .from(storesTable)
        .where(eq(storesTable.id, id))
        .limit(1);

      if (store.length === 0) {
        throw new AppError(storeErrors.STORE_NOT_FOUND);
      }

      return {
        code: 0,
        data: store[0],
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.GET_FAILED);
    }
  });

  /**
   * 新增门店
   * url：/api/v1/stores
   */
  app.post<{
    Body: CreateStoreInput;
    Reply: ApiResponse<CreateStoreResponse>;
  }>('/stores', async (request, reply) => {
    try {
      const db = await getDb();
      const { name, province, city, district, address, businessHours, phone, account, email } = request.body;

      if (!name) {
        throw new AppError(storeErrors.NAME_REQUIRED);
      }

      if (!account) {
        throw new AppError(storeErrors.ACCOUNT_REQUIRED);
      }

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
        request.log.warn({ address: [province, city, district, address].filter(Boolean).join('') }, 'Geocoding failed, using default coordinates');
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

      try {
        await request.server.redis.geoadd('dextea:store:location', longitude, latitude, String(insertId));
      } catch (redisError) {
        request.log.error(redisError, 'Failed to store location in Redis');
      }

      return {
        code: 0,
        data: { id: insertId, initialPassword },
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.CREATE_FAILED);
    }
  });

  /**
   * 更新门店
   * url：/api/v1/stores/:id
   */
  app.put<{
    Params: { id: string };
    Body: UpdateStoreInput;
    Reply: ApiResponse<UpdateStoreResponse>;
  }>('/stores/:id', async (request, reply) => {
    try {
      const db = await getDb();
      const id = parseInt(request.params.id, 10);
      const { name, province, city, district, address, status, businessHours, phone, longitude, latitude } = request.body;

      if (!name) {
        throw new AppError(storeErrors.NAME_REQUIRED);
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

      return {
        code: 0,
        data: { id },
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.UPDATE_FAILED);
    }
  });

  /**
   * 更新门店基础信息
   * url：/api/v1/stores/:id/basic-info
   */
  app.patch<{
    Params: { id: string };
    Body: UpdateStoreBasicInfoRequest;
    Reply: ApiResponse<UpdateStoreBasicInfoResponse>;
  }>('/stores/:id/basic-info', async (request, reply) => {
    try {
      const db = await getDb();
      const id = parseInt(request.params.id, 10);
      const { name, phone, businessHours, email } = request.body;

      if (!name) {
        throw new AppError(storeErrors.NAME_REQUIRED);
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
        .set({ name, phone, businessHours, email: email ?? '' })
        .where(eq(storesTable.id, id));

      return {
        code: 0,
        data: { id },
        message: '门店基础信息更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.BASIC_INFO_UPDATE_FAILED);
    }
  });

  /**
   * 更新门店位置
   * url：/api/v1/stores/:id/location
   */
  app.patch<{
    Params: { id: string };
    Body: UpdateStoreLocationRequest;
    Reply: ApiResponse<UpdateStoreLocationResponse>;
  }>('/stores/:id/location', async (request, reply) => {
    try {
      const db = await getDb();
      const id = parseInt(request.params.id, 10);
      const { province, city, district, address, longitude, latitude } = request.body;

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

      try {
        await request.server.redis.zrem('dextea:store:location', String(id));
        if (longitude && latitude) {
          await request.server.redis.geoadd('dextea:store:location', longitude, latitude, String(id));
        }
      } catch (redisError) {
        request.log.error(redisError, 'Failed to update store location in Redis');
      }

      return {
        code: 0,
        data: { id },
        message: '门店位置更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.LOCATION_UPDATE_FAILED);
    }
  });

  /**
   * 同步门店定位数据到 Redis
   * url：/api/v1/stores/sync-locations
   * POST - 清除 Redis 中的门店定位数据，从 MySQL 重新同步
   */
  app.post<{
    Reply: ApiResponse<{ synced: number }>;
  }>('/stores/sync-locations', async (request, reply) => {
    try {
      const db = await getDb();

      // 1. 清除 Redis 中的门店定位数据
      await request.server.redis.del('dextea:store:location');

      // 2. 从 MySQL 查询所有有经纬度的门店
      const stores = await db
        .select({ id: storesTable.id, longitude: storesTable.longitude, latitude: storesTable.latitude })
        .from(storesTable);

      // 3. 批量写入 Redis
      let synced = 0;
      for (const store of stores) {
        if (store.longitude && store.latitude) {
          await request.server.redis.geoadd('dextea:store:location', store.longitude, store.latitude, String(store.id));
          synced++;
        }
      }

      return {
        code: 0,
        data: { synced },
        message: `同步完成，共同步 ${synced} 家门店`,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.SYNC_FAILED);
    }
  });

  /**
   * 更新门店状态
   * url：/api/v1/stores/:id/status
   */
  app.patch<{
    Params: { id: string };
    Body: UpdateStoreStatusRequest;
    Reply: ApiResponse<UpdateStoreStatusResponse>;
  }>('/stores/:id/status', async (request, reply) => {
    try {
      const db = await getDb();
      const id = parseInt(request.params.id, 10);
      const { status } = request.body;

      const validStatuses = STORE_STATUS_VALUES;
      if (!validStatuses.includes(status)) {
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

      return {
        code: 0,
        data: { status },
        message: `门店状态已更新为「${STORE_STATUS_LABEL[status] ?? '未知'}」`,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.STATUS_UPDATE_FAILED);
    }
  });

  /**
   * 重置门店密码
   * url：/api/v1/stores/:id/reset-password
   */
  app.post<{
    Params: { id: string };
    Reply: ApiResponse<ResetStorePasswordResponse>;
  }>('/stores/:id/reset-password', async (request, reply) => {
    try {
      const db = await getDb();
      const id = parseInt(request.params.id, 10);

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

      return {
        code: 0,
        data: { newPassword },
        message: '密码重置成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.RESET_PASSWORD_FAILED);
    }
  });
}
