import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { storeCatalogService } from './store-catalog.service.js';
import {
  StoreProductListResponseSchema,
  StoreCustomizationListResponseSchema,
  StoreCustomizationOptionListResponseSchema,
  StoreIngredientListResponseSchema,
  StoreIdParamsSchema,
  ProductIdParamsSchema,
  CustomizationIdParamsSchema,
  CustomizationOptionIdParamsSchema,
  ProductListQuerySchema,
  PaginationQuerySchema,
  StoreCustomizationListQuerySchema,
  UpdateProductStoreStatusBodySchema,
  UpdateOptionStoreStatusBodySchema,
  BatchUpdateProductStoreStatusBodySchema,
  BatchUpdateProductStoreStatusResponseSchema,
} from '@dextea-admin/contracts';

export const registerStoreCatalogRoutes: FastifyPluginAsyncZod = async (app) => {
  // 门店商品列表（含门店状态）
  app.get(
    '/stores/:storeId/products',
    {
      schema: {
        tags: ['StoreCatalog'],
        description: '门店商品列表（含门店状态）',
        params: StoreIdParamsSchema,
        querystring: ProductListQuerySchema,
        response: { 200: ApiResponseSchema(StoreProductListResponseSchema).describe('门店商品列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeCatalogService.listStoreProducts(
        request.params.storeId,
        request.query,
      );
      return ApiResponse.success(data);
    },
  );

  // 批量设置商品门店状态
  app.post(
    '/stores/:storeId/products/batch/status',
    {
      schema: {
        tags: ['StoreCatalog'],
        description: '批量设置商品门店状态',
        params: StoreIdParamsSchema,
        body: BatchUpdateProductStoreStatusBodySchema,
        response: {
          200: ApiResponseSchema(BatchUpdateProductStoreStatusResponseSchema).describe('批量状态更新成功'),
        },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeCatalogService.batchUpdateProductStoreStatus(
        request.params.storeId,
        request.body.productIds,
        request.body.status,
      );
      return ApiResponse.success(
        data,
        `已将 ${data.updatedCount} 个商品设为${request.body.status === 1 ? '门店可售' : '门店售罄'}`,
      );
    },
  );

  // 设置商品门店状态
  app.patch(
    '/stores/:storeId/products/:productId/status',
    {
      schema: {
        tags: ['StoreCatalog'],
        description: '设置商品门店状态',
        params: ProductIdParamsSchema,
        body: UpdateProductStoreStatusBodySchema,
        response: { 200: ApiResponseSchema(z.null()).describe('状态更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await storeCatalogService.upsertProductStoreStatus(
        request.params.storeId,
        request.params.productId,
        request.body.status,
      );
      return ApiResponse.success(null, request.body.status === 1 ? '已启用' : '已禁用');
    },
  );

  // 门店客制化项目列表
  app.get(
    '/stores/:storeId/customizations',
    {
      schema: {
        tags: ['StoreCatalog'],
        description: '门店客制化项目列表',
        params: StoreIdParamsSchema,
        querystring: StoreCustomizationListQuerySchema,
        response: { 200: ApiResponseSchema(StoreCustomizationListResponseSchema).describe('门店客制化项目列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeCatalogService.listStoreCustomizations(
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
        tags: ['StoreCatalog'],
        description: '门店客制化选项列表（含门店状态）',
        params: CustomizationIdParamsSchema,
        querystring: PaginationQuerySchema,
        response: { 200: ApiResponseSchema(StoreCustomizationOptionListResponseSchema).describe('门店客制化选项列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeCatalogService.listStoreCustomizationOptions(
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
        tags: ['StoreCatalog'],
        description: '设置客制化选项门店状态',
        params: CustomizationOptionIdParamsSchema,
        body: UpdateOptionStoreStatusBodySchema,
        response: { 200: ApiResponseSchema(z.null()).describe('状态更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await storeCatalogService.upsertCustomizationOptionStoreStatus(
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
        tags: ['StoreCatalog'],
        description: '门店原料库存列表',
        params: StoreIdParamsSchema,
        querystring: PaginationQuerySchema,
        response: { 200: ApiResponseSchema(StoreIngredientListResponseSchema).describe('门店原料库存列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeCatalogService.listStoreIngredients(
        request.params.storeId,
        request.query,
      );
      return ApiResponse.success(data);
    },
  );
};
