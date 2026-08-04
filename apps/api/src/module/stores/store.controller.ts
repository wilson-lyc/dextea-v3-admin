import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { storeService } from './store.service.js';
import {
  StoreListRequestSchema,
  StoreListResponseSchema,
  StoreGetResponseSchema,
  CreateStoreRequestSchema,
  CreateStoreResponseSchema,
  UpdateStoreProfileRequestSchema,
  UpdateStoreProfileResponseSchema,
  UpdateStoreLocationRequestSchema,
  UpdateStoreLocationResponseSchema,
  UpdateStoreStatusRequestSchema,
  UpdateStoreStatusResponseSchema,
  ResetStorePasswordResponseSchema,
  SyncLocationsResponseSchema,
} from '@dextea-admin/contracts';

export const registerStoreRoutes: FastifyPluginAsyncZod = async (app) => {
  // 门店列表
  app.get(
    '/stores',
    {
      schema: {
        tags: ['Stores'],
        description: '门店列表',
        querystring: StoreListRequestSchema,
        response: { 200: ApiResponseSchema(StoreListResponseSchema).describe('门店列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.getStoreList(request.query);
      return ApiResponse.success(data, '查询成功');
    },
  );

  // 门店详情
  app.get(
    '/stores/:id/info',
    {
      schema: {
        tags: ['Stores'],
        description: '门店详情',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        response: { 200: ApiResponseSchema(StoreGetResponseSchema).describe('门店详情') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.getStoreById(request.params.id);
      return ApiResponse.success(data, '查询成功');
    },
  );

  // 新增门店
  app.post(
    '/stores',
    {
      schema: {
        tags: ['Stores'],
        description: '新增门店',
        body: CreateStoreRequestSchema,
        response: { 200: ApiResponseSchema(CreateStoreResponseSchema).describe('创建成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.createStore(request.body);
      return ApiResponse.success(data, '创建成功');
    },
  );

  // 更新门店基础信息
  app.patch(
    '/stores/:id/profile',
    {
      schema: {
        tags: ['Stores'],
        description: '更新门店基础信息',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateStoreProfileRequestSchema,
        response: { 200: ApiResponseSchema(UpdateStoreProfileResponseSchema).describe('基础信息更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.updateStoreBasicInfo(request.params.id, request.body);
      return ApiResponse.success(data, '基础信息更新成功');
    },
  );

  // 更新门店位置
  app.patch(
    '/stores/:id/location',
    {
      schema: {
        tags: ['Stores'],
        description: '更新门店位置',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateStoreLocationRequestSchema,
        response: { 200: ApiResponseSchema(UpdateStoreLocationResponseSchema).describe('位置更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.updateStoreLocation(request.params.id, request.body);
      return ApiResponse.success(data, '位置信息更新成功');
    },
  );

  // 同步门店定位数据到 Redis
  app.post(
    '/stores/sync-locations',
    {
      schema: {
        tags: ['Stores'],
        description: '同步门店定位数据到 Redis',
        response: { 200: ApiResponseSchema(SyncLocationsResponseSchema).describe('同步结果') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, _reply) => {
      const data = await storeService.syncStoreLocations();
      return ApiResponse.success(data, '门店定位同步完成');
    },
  );

  // 更新门店状态
  app.patch(
    '/stores/:id/status',
    {
      schema: {
        tags: ['Stores'],
        description: '更新门店状态',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateStoreStatusRequestSchema,
        response: { 200: ApiResponseSchema(UpdateStoreStatusResponseSchema).describe('状态更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.updateStoreStatus(request.params.id, request.body);
      return ApiResponse.success(data, '状态更新成功');
    },
  );

  // 重置门店密码
  app.post(
    '/stores/:id/reset-password',
    {
      schema: {
        tags: ['Stores'],
        description: '重置门店密码',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        response: { 200: ApiResponseSchema(ResetStorePasswordResponseSchema).describe('密码重置成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.resetStorePassword(request.params.id);
      return ApiResponse.success(data, '密码重置成功');
    },
  );

};
