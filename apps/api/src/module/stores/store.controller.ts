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
  UpdateStoreRequestSchema,
  UpdateStoreResponseSchema,
  UpdateStoreBasicInfoRequestSchema,
  UpdateStoreBasicInfoResponseSchema,
  UpdateStoreLocationRequestSchema,
  UpdateStoreLocationResponseSchema,
  UpdateStoreStatusRequestSchema,
  UpdateStoreStatusResponseSchema,
  ResetStorePasswordResponseSchema,
  BindStoreMenuRequestSchema,
  BindStoreMenuResponseSchema,
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
      return ApiResponse.success(data);
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
      return ApiResponse.success(data);
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
      return ApiResponse.success(data);
    },
  );

  // 更新门店
  app.put(
    '/stores/:id/info',
    {
      schema: {
        tags: ['Stores'],
        description: '更新门店',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateStoreRequestSchema,
        response: { 200: ApiResponseSchema(UpdateStoreResponseSchema).describe('更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.updateStore(request.params.id, request.body);
      return ApiResponse.success(data);
    },
  );

  // 更新门店基础信息
  app.patch(
    '/stores/:id/basic-info',
    {
      schema: {
        tags: ['Stores'],
        description: '更新门店基础信息',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateStoreBasicInfoRequestSchema,
        response: { 200: ApiResponseSchema(UpdateStoreBasicInfoResponseSchema).describe('基础信息更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.updateStoreBasicInfo(request.params.id, request.body);
      return ApiResponse.success(data);
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
      return ApiResponse.success(data);
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
      return ApiResponse.success(data);
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
      return ApiResponse.success(data);
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
      return ApiResponse.success(data);
    },
  );

  // 绑定门店菜单
  app.patch(
    '/stores/:id/menu',
    {
      schema: {
        tags: ['Stores'],
        description: '绑定门店菜单',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: BindStoreMenuRequestSchema,
        response: { 200: ApiResponseSchema(BindStoreMenuResponseSchema).describe('菜单绑定成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.bindStoreMenu(request.params.id, request.body);
      return ApiResponse.success(data);
    },
  );

  // 门店目录（商品/客制化/原料的门店级覆盖）已迁移至 store-catalog 模块
};
