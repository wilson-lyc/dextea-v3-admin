import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { storeStatusService } from './store-status.service.js';
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
  UpdateProductStoreStatusBodySchema,
  UpdateOptionStoreStatusBodySchema,
} from '@dextea-admin/contracts';

export const registerStoreStatusRoutes: FastifyPluginAsyncZod = async (app) => {
  // 门店商品列表（含门店状态）
  app.get(
    '/stores/:storeId/products',
    {
      schema: {
        tags: ['Store-Status'],
        description: '门店商品列表（含门店状态）',
        params: StoreIdParamsSchema,
        querystring: ProductListQuerySchema,
        response: { 200: ApiResponseSchema(StoreProductListResponseSchema).describe('门店商品列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeStatusService.listStoreProducts(
        request.params.storeId,
        request.query,
      );
      return ApiResponse.success(data);
    },
  );

  // 设置商品门店状态
  app.put(
    '/stores/:storeId/products/:productId/status',
    {
      schema: {
        tags: ['Store-Status'],
        description: '设置商品门店状态',
        params: ProductIdParamsSchema,
        body: UpdateProductStoreStatusBodySchema,
        response: { 200: ApiResponseSchema(z.null()).describe('状态更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await storeStatusService.upsertProductStoreStatus(
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
        tags: ['Store-Status'],
        description: '门店客制化项目列表（含门店状态）',
        params: StoreIdParamsSchema,
        querystring: PaginationQuerySchema,
        response: { 200: ApiResponseSchema(StoreCustomizationListResponseSchema).describe('门店客制化项目列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeStatusService.listStoreCustomizations(
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
        tags: ['Store-Status'],
        description: '门店客制化选项列表（含门店状态）',
        params: CustomizationIdParamsSchema,
        querystring: PaginationQuerySchema,
        response: { 200: ApiResponseSchema(StoreCustomizationOptionListResponseSchema).describe('门店客制化选项列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeStatusService.listStoreCustomizationOptions(
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
        tags: ['Store-Status'],
        description: '设置客制化选项门店状态',
        params: CustomizationOptionIdParamsSchema,
        body: UpdateOptionStoreStatusBodySchema,
        response: { 200: ApiResponseSchema(z.null()).describe('状态更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await storeStatusService.upsertCustomizationOptionStoreStatus(
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
        tags: ['Store-Status'],
        description: '门店原料库存列表',
        params: StoreIdParamsSchema,
        querystring: PaginationQuerySchema,
        response: { 200: ApiResponseSchema(StoreIngredientListResponseSchema).describe('门店原料库存列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await storeStatusService.listStoreIngredients(
        request.params.storeId,
        request.query,
      );
      return ApiResponse.success(data);
    },
  );
};
