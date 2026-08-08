import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { productService } from './product.service.js';
import {
  ProductListRequestSchema,
  ProductListResponseSchema,
  ProductBasicInfoResponseSchema,
  CreateProductRequestSchema,
  CreateProductResponseSchema,
  UpdateProductRequestSchema,
  UpdateProductResponseSchema,
  UpdateProductStatusRequestSchema,
  UpdateProductStatusResponseSchema,
  BatchUpdateProductStatusRequestSchema,
  BatchUpdateProductStatusResponseSchema,
  ProductTagListRequestSchema,
  ProductTagListResponseSchema,
  BindTagsRequestSchema,
  UnbindTagsRequestSchema,
  ProductIngredientListRequestSchema,
  ProductIngredientListResponseSchema,
  BindIngredientRequestSchema,
  UpdateIngredientQuantityRequestSchema,
  UpdateIngredientSortRequestSchema,
  ProductOptionListResponseSchema,
  GetProductImagesResponseSchema,
  SetProductImagesRequestSchema,
  SetProductImagesResponseSchema,
} from '@dextea-admin/contracts';

export const registerProductRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/products',
    {
      schema: {
        tags: ['Products'],
        description: '商品列表（分页 + 多条件筛选 + 标签关联）',
        querystring: ProductListRequestSchema,
        response: { 200: ApiResponseSchema(ProductListResponseSchema).describe('商品列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productService.getProductList(request.query);
      return ApiResponse.success(data, '查询商品列表成功');
    },
  );

  app.post(
    '/products',
    {
      schema: {
        tags: ['Products'],
        description: '新增商品',
        body: CreateProductRequestSchema,
        response: { 200: ApiResponseSchema(CreateProductResponseSchema).describe('创建成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productService.createProduct(request.body);
      return ApiResponse.success(data, '创建商品成功');
    },
  );

  app.get(
    '/products/options',
    {
      schema: {
        tags: ['Products'],
        description: '商品选项列表（SelectPicker 使用）',
        response: { 200: ApiResponseSchema(ProductOptionListResponseSchema).describe('商品选项列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, _reply) => {
      const data = await productService.getProductOptionSelectList();
      return ApiResponse.success(data, '查询商品选项列表成功');
    },
  );

  app.get(
    '/products/:id/info',
    {
      schema: {
        tags: ['Products'],
        description: '商品基础信息',
        params: z.object({ id: z.coerce.number().int().positive('商品ID 必须为正整数') }),
        response: { 200: ApiResponseSchema(ProductBasicInfoResponseSchema).describe('商品基础信息') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productService.getProductBasicInfo(request.params.id);
      return ApiResponse.success(data, '查询商品基础信息成功');
    },
  );

  app.get(
    '/products/:id/tags',
    {
      schema: {
        tags: ['Products'],
        description: '商品标签列表（分页）',
        params: z.object({ id: z.coerce.number().int().positive('商品ID 必须为正整数') }),
        querystring: ProductTagListRequestSchema,
        response: { 200: ApiResponseSchema(ProductTagListResponseSchema).describe('商品标签列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productService.getProductTagList(
        request.params.id,
        request.query.page,
        request.query.pageSize,
      );
      return ApiResponse.success(data, '查询商品标签列表成功');
    },
  );

  app.put(
    '/products/:id/info',
    {
      schema: {
        tags: ['Products'],
        description: '更新商品',
        params: z.object({ id: z.coerce.number().int().positive('商品ID 必须为正整数') }),
        body: UpdateProductRequestSchema,
        response: { 200: ApiResponseSchema(UpdateProductResponseSchema).describe('更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productService.updateProduct(request.params.id, request.body);
      return ApiResponse.success(data, '更新商品成功');
    },
  );

  app.patch(
    '/products/:id/status',
    {
      schema: {
        tags: ['Products'],
        description: '上下架商品',
        params: z.object({ id: z.coerce.number().int().positive('商品ID 必须为正整数') }),
        body: UpdateProductStatusRequestSchema,
        response: { 200: ApiResponseSchema(UpdateProductStatusResponseSchema).describe('状态更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productService.updateProductStatus(request.params.id, request.body);
      return ApiResponse.success(data, '更新商品状态成功');
    },
  );

  app.post(
    '/products/batch/status',
    {
      schema: {
        tags: ['Products'],
        description: '批量更新商品状态（全局上架/下架）',
        body: BatchUpdateProductStatusRequestSchema,
        response: { 200: ApiResponseSchema(BatchUpdateProductStatusResponseSchema).describe('批量更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productService.batchUpdateProductStatus(request.body);
      return ApiResponse.success(data, '批量更新商品状态成功');
    },
  );

  app.post(
    '/products/:id/tags',
    {
      schema: {
        tags: ['Products'],
        description: '批量绑定标签到商品',
        params: z.object({ id: z.coerce.number().int().positive('商品ID 必须为正整数') }),
        body: BindTagsRequestSchema,
        response: { 200: ApiResponseSchema(z.null()).describe('绑定成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await productService.bindTagToProduct(request.params.id, request.body);
      return ApiResponse.success(null, '绑定标签成功');
    },
  );

  app.delete(
    '/products/:id/tags',
    {
      schema: {
        tags: ['Products'],
        description: '批量解绑标签与商品的关联',
        params: z.object({ id: z.coerce.number().int().positive('商品ID 必须为正整数') }),
        body: UnbindTagsRequestSchema,
        response: { 200: ApiResponseSchema(z.null()).describe('解绑成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await productService.unbindTagFromProduct(request.params.id, request.body);
      return ApiResponse.success(null, '解绑标签成功');
    },
  );

  app.get(
    '/products/:id/ingredients',
    {
      schema: {
        tags: ['Products'],
        description: '获取绑定原料列表（分页）',
        params: z.object({ id: z.coerce.number().int().positive('商品ID 必须为正整数') }),
        querystring: ProductIngredientListRequestSchema,
        response: { 200: ApiResponseSchema(ProductIngredientListResponseSchema).describe('原料列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productService.getProductIngredientList(
        request.params.id,
        request.query.page,
        request.query.pageSize,
      );
      return ApiResponse.success(data, '查询商品原料列表成功');
    },
  );

  app.post(
    '/products/:id/ingredients',
    {
      schema: {
        tags: ['Products'],
        description: '绑定原料到商品',
        params: z.object({ id: z.coerce.number().int().positive('商品ID 必须为正整数') }),
        body: BindIngredientRequestSchema,
        response: { 200: ApiResponseSchema(z.null()).describe('绑定成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await productService.bindIngredient(request.params.id, request.body);
      return ApiResponse.success(null, '绑定原料成功');
    },
  );

  app.patch(
    '/products/:id/ingredients/:ingredientId/quantity',
    {
      schema: {
        tags: ['Products'],
        description: '更新绑定原料的用量',
        params: z.object({
          id: z.coerce.number().int().positive('商品ID 必须为正整数'),
          ingredientId: z.coerce.number().int().positive('原料ID 必须为正整数'),
        }),
        body: UpdateIngredientQuantityRequestSchema,
        response: { 200: ApiResponseSchema(z.null()).describe('更新用量成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await productService.updateIngredientQuantity(
        request.params.id,
        request.params.ingredientId,
        request.body,
      );
      return ApiResponse.success(null, '更新原料用量成功');
    },
  );

  app.patch(
    '/products/:id/ingredients/:ingredientId/sort',
    {
      schema: {
        tags: ['Products'],
        description: '更新绑定原料在商品中的排序',
        params: z.object({
          id: z.coerce.number().int().positive('商品ID 必须为正整数'),
          ingredientId: z.coerce.number().int().positive('原料ID 必须为正整数'),
        }),
        body: UpdateIngredientSortRequestSchema,
        response: { 200: ApiResponseSchema(z.null()).describe('更新排序成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await productService.updateIngredientSort(
        request.params.id,
        request.params.ingredientId,
        request.body,
      );
      return ApiResponse.success(null, '更新原料排序成功');
    },
  );

  app.delete(
    '/products/:id/ingredients/:ingredientId',
    {
      schema: {
        tags: ['Products'],
        description: '解绑原料',
        params: z.object({
          id: z.coerce.number().int().positive('商品ID 必须为正整数'),
          ingredientId: z.coerce.number().int().positive('原料ID 必须为正整数'),
        }),
        response: { 200: ApiResponseSchema(z.null()).describe('解绑成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await productService.unbindIngredient(request.params.id, request.params.ingredientId);
      return ApiResponse.success(null, '解绑原料成功');
    },
  );

  app.get(
    '/products/:id/images',
    {
      schema: {
        tags: ['Products'],
        description: '获取商品绑定的图片（封面图 + 图库）',
        params: z.object({ id: z.coerce.number().int().positive('商品ID 必须为正整数') }),
        response: { 200: ApiResponseSchema(GetProductImagesResponseSchema).describe('商品图片') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productService.getProductImages(request.params.id);
      return ApiResponse.success(data, '查询商品图片成功');
    },
  );

  app.put(
    '/products/:id/images',
    {
      schema: {
        tags: ['Products'],
        description: '设置商品图片（全量替换：封面图 + 图库），封面可留空，图库最多 10 张',
        params: z.object({ id: z.coerce.number().int().positive('商品ID 必须为正整数') }),
        body: SetProductImagesRequestSchema,
        response: { 200: ApiResponseSchema(SetProductImagesResponseSchema).describe('保存成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productService.setProductImages(request.params.id, request.body);
      return ApiResponse.success(data, '保存商品图片成功');
    },
  );
};
