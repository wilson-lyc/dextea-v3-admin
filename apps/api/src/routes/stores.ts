import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { storesTable } from '../db/schema.js';
import { geocode } from '../utils/geocode.js';

export async function storeRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: { page?: string; pageSize?: string; keyword?: string };
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
      request.log.error(error);
      return reply.status(500).send({
        code: 1,
        data: null,
        message: '获取门店列表失败',
      });
    }
  });

  app.get<{
    Params: { id: string };
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
        return reply.status(404).send({
          code: 1,
          data: null,
          message: '门店不存在',
        });
      }

      return {
        code: 0,
        data: store[0],
        message: 'ok',
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        code: 1,
        data: null,
        message: '获取门店信息失败',
      });
    }
  });

  app.post<{
    Body: {
      name: string;
      province: string;
      city: string;
      district: string;
      address: string;
      businessHours: string;
      phone: string;
    };
  }>('/stores', async (request, reply) => {
    try {
      const db = await getDb();
      const { name, province, city, district, address, businessHours, phone } = request.body;

      if (!name) {
        return reply.status(400).send({
          code: 1,
          data: null,
          message: '门店名称不能为空',
        });
      }

      // Auto-geocode from address
      const coords = await geocode(province, city, district, address);
      const longitude = coords?.longitude ?? 0;
      const latitude = coords?.latitude ?? 0;

      if (!coords) {
        request.log.warn({ address: [province, city, district, address].filter(Boolean).join('') }, 'Geocoding failed, using default coordinates');
      }

      const result = await db.insert(storesTable).values({
        name,
        province: province ?? '',
        city: city ?? '',
        district: district ?? '',
        address: address ?? '',
        businessHours: businessHours ?? '',
        phone: phone ?? '',
        longitude,
        latitude,
      });

      const insertId = Number(result[0]?.insertId ?? 0);

      // Store location in Redis for nearby search
      try {
        await request.server.redis.geoadd('dextea:store:location', longitude, latitude, String(insertId));
      } catch (redisError) {
        request.log.error(redisError, 'Failed to store location in Redis');
      }

      return {
        code: 0,
        data: { id: insertId },
        message: '创建成功',
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        code: 1,
        data: null,
        message: '创建门店失败',
      });
    }
  });

  app.put<{
    Params: { id: string };
    Body: {
      name: string;
      province: string;
      city: string;
      district: string;
      address: string;
      status: number;
      businessHours: string;
      phone: string;
      longitude?: number;
      latitude?: number;
    };
  }>('/stores/:id', async (request, reply) => {
    try {
      const db = await getDb();
      const id = parseInt(request.params.id, 10);
      const { name, province, city, district, address, status, businessHours, phone, longitude, latitude } = request.body;

      if (!name) {
        return reply.status(400).send({
          code: 1,
          data: null,
          message: '门店名称不能为空',
        });
      }

      const store = await db
        .select()
        .from(storesTable)
        .where(eq(storesTable.id, id))
        .limit(1);

      if (store.length === 0) {
        return reply.status(404).send({
          code: 1,
          data: null,
          message: '门店不存在',
        });
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
      request.log.error(error);
      return reply.status(500).send({
        code: 1,
        data: null,
        message: '更新门店失败',
      });
    }
  });

  app.patch<{
    Params: { id: string };
    Body: { status: number };
  }>('/stores/:id/status', async (request, reply) => {
    try {
      const db = await getDb();
      const id = parseInt(request.params.id, 10);
      const { status } = request.body;

      const validStatuses = [0, 1, 2, 3];
      if (!validStatuses.includes(status)) {
        return reply.status(400).send({
          code: 1,
          data: null,
          message: '无效的状态值',
        });
      }

      const store = await db
        .select()
        .from(storesTable)
        .where(eq(storesTable.id, id))
        .limit(1);

      if (store.length === 0) {
        return reply.status(404).send({
          code: 1,
          data: null,
          message: '门店不存在',
        });
      }

      await db
        .update(storesTable)
        .set({ status })
        .where(eq(storesTable.id, id));

      const statusLabels: Record<number, string> = {
        0: '休息中',
        1: '营业中',
        2: '筹备中',
        3: '门店已注销',
      };

      return {
        code: 0,
        data: { status },
        message: `门店状态已更新为「${statusLabels[status] ?? '未知'}」`,
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        code: 1,
        data: null,
        message: '更新门店状态失败',
      });
    }
  });
}
