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
  StoreProductListResponseSchema,
  StoreCustomizationListResponseSchema,
  StoreCustomizationOptionListResponseSchema,
  StoreIngredientListResponseSchema,
  StoreIdParamsSchema,
  ProductIdParamsSchema,
  CustomizationIdParamsSchema,
  CustomizationOptionIdParamsSchema,
  StoreIngredientParamsSchema,
  ProductListQuerySchema,
  PaginationQuerySchema,
  UpdateProductStoreStatusBodySchema,
  UpdateOptionStoreStatusBodySchema,
  UpdateStoreIngredientStockBodySchema,
  UpdateStoreIngredientStockResponseSchema,
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

  // 门店商品列表（含门店状态）
  app.get(
    '/stores/:storeId/products',
    {
      schema: {
        tags: ['Stores'],
        description: '门店商品列表（含门店状态）',
        params: StoreIdParamsSchema,
        querystring: ProductListQuerySchema,
        response: { 200: ApiResponseSchema(StoreProductListResponseSchema).describe('门店商品列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.listStoreProducts(
        request.params.storeId,
        request.query,
      );
      return ApiResponse.success(data);
    },
  );

  // 设置商品门店状态
  app.patch(
    '/stores/:storeId/products/:productId/status',
    {
      schema: {
        tags: ['Stores'],
        description: '设置商品门店状态',
        params: ProductIdParamsSchema,
        body: UpdateProductStoreStatusBodySchema,
        response: { 200: ApiResponseSchema(z.null()).describe('状态更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await storeService.upsertProductStoreStatus(
        request.params.storeId,
        request.params.productId,
        request.body.status,
      );
      return ApiResponse.success(null, request.body.status === 1 ? '已启用' : '已禁用');
    },
  );

  // 门店客制化项目列表（含门店状态）
  app.get(
    '/stores/:storeId/customizations',
    {
      schema: {
        tags: ['Stores'],
        description: '门店客制化项目列表（含门店状态）',
        params: StoreIdParamsSchema,
        querystring: PaginationQuerySchema,
        response: { 200: ApiResponseSchema(StoreCustomizationListResponseSchema).describe('门店客制化项目列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.listStoreCustomizations(
        request.params.storeId,
        request.query,
      );
      return ApiResponse.success(data);
    },
  );

  // 门店客制化选项列表（含门店状态）
  app.get(
    '/stores/:storeId/customizations/:customizationId/options',
    {
      schema: {
        tags: ['Stores'],
        description: '门店客制化选项列表（含门店状态）',
        params: CustomizationIdParamsSchema,
        querystring: PaginationQuerySchema,
        response: { 200: ApiResponseSchema(StoreCustomizationOptionListResponseSchema).describe('门店客制化选项列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.listStoreCustomizationOptions(
        request.params.storeId,
        request.params.customizationId,
        request.query,
      );
      return ApiResponse.success(data);
    },
  );

  // 设置客制化选项门店状态
  app.patch(
    '/stores/:storeId/customization-options/:optionId/status',
    {
      schema: {
        tags: ['Stores'],
        description: '设置客制化选项门店状态',
        params: CustomizationOptionIdParamsSchema,
        body: UpdateOptionStoreStatusBodySchema,
        response: { 200: ApiResponseSchema(z.null()).describe('状态更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await storeService.upsertCustomizationOptionStoreStatus(
        request.params.storeId,
        request.params.optionId,
        request.body.status,
      );
      return ApiResponse.success(null, request.body.status === 1 ? '已启用' : '已禁用');
    },
  );

  // 门店原料库存列表
  app.get(
    '/stores/:storeId/ingredients',
    {
      schema: {
        tags: ['Stores'],
        description: '门店原料库存列表',
        params: StoreIdParamsSchema,
        querystring: PaginationQuerySchema,
        response: { 200: ApiResponseSchema(StoreIngredientListResponseSchema).describe('门店原料库存列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.listStoreIngredients(
        request.params.storeId,
        request.query,
      );
      return ApiResponse.success(data);
    },
  );

  // 更新门店原料库存
  app.patch(
    '/stores/:storeId/ingredients/:ingredientId/stock',
    {
      schema: {
        tags: ['Stores'],
        description: '更新门店原料库存（分布式锁保护，并发修改需重试）',
        params: StoreIngredientParamsSchema,
        body: UpdateStoreIngredientStockBodySchema,
        response: { 200: ApiResponseSchema(UpdateStoreIngredientStockResponseSchema).describe('库存更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeService.updateStoreIngredientStock(
        request.params.storeId,
        request.params.ingredientId,
        request.body.quantity,
      );
      return ApiResponse.success(data);
    },
  );
};
