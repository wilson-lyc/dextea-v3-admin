import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { ingredientService } from './ingredient.service.js';
import {
  IngredientListRequestSchema,
  IngredientListResponseSchema,
  IngredientDetailResponseSchema,
  CreateIngredientRequestSchema,
  CreateIngredientResponseSchema,
  UpdateIngredientRequestSchema,
  UpdateIngredientResponseSchema,
  UpdateIngredientStatusRequestSchema,
  IngredientOptionListResponseSchema,
  IngredientOptionSelectListResponseSchema,
  IngredientProductListResponseSchema,
} from '@dextea-admin/contracts';

const ParamsWithId = z.object({
  id: z.coerce.number().int().positive('ID 必须为正整数'),
});

const PaginatedQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const registerIngredientRoutes: FastifyPluginAsyncZod = async (app) => {
  // 原料列表
  app.get(
    '/ingredients',
    {
      schema: {
        tags: ['Ingredients'],
        description: '原料列表（分页 + 关键词搜索）',
        querystring: IngredientListRequestSchema,
        response: { 200: ApiResponseSchema(IngredientListResponseSchema).describe('原料列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await ingredientService.getIngredientList(request.query);
      return ApiResponse.success(data);
    },
  );

  // 新增原料
  app.post(
    '/ingredients',
    {
      schema: {
        tags: ['Ingredients'],
        description: '新增原料',
        body: CreateIngredientRequestSchema,
        response: { 200: ApiResponseSchema(CreateIngredientResponseSchema).describe('创建成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await ingredientService.createIngredient(request.body);
      return ApiResponse.success(data);
    },
  );

  // 原料详情
  app.get(
    '/ingredients/:id/info',
    {
      schema: {
        tags: ['Ingredients'],
        description: '原料详情',
        params: ParamsWithId,
        response: { 200: ApiResponseSchema(IngredientDetailResponseSchema).describe('原料详情') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await ingredientService.getIngredientById(request.params.id);
      return ApiResponse.success(data);
    },
  );

  // 更新原料
  app.put(
    '/ingredients/:id/info',
    {
      schema: {
        tags: ['Ingredients'],
        description: '更新原料',
        params: ParamsWithId,
        body: UpdateIngredientRequestSchema,
        response: { 200: ApiResponseSchema(UpdateIngredientResponseSchema).describe('更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await ingredientService.updateIngredient(request.params.id, request.body);
      return ApiResponse.success(data);
    },
  );

  // 更新原料状态
  app.patch(
    '/ingredients/:id/status',
    {
      schema: {
        tags: ['Ingredients'],
        description: '更新原料状态',
        params: ParamsWithId,
        body: UpdateIngredientStatusRequestSchema,
        response: { 200: ApiResponseSchema(IngredientDetailResponseSchema).describe('状态更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await ingredientService.updateIngredientStatus(request.params.id, request.body);
      return ApiResponse.success(data);
    },
  );

  // 原料选项列表（供 SelectPicker）
  app.get(
    '/ingredients/options',
    {
      schema: {
        tags: ['Ingredients'],
        description: '原料选项列表（供 SelectPicker）',
        response: { 200: ApiResponseSchema(IngredientOptionSelectListResponseSchema).describe('原料选项列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, _reply) => {
      const data = await ingredientService.getIngredientOptionSelectList();
      return ApiResponse.success(data);
    },
  );

  // 获取引用此原料的客制化选项列表
  app.get(
    '/ingredients/:id/customization-options',
    {
      schema: {
        tags: ['Ingredients'],
        description: '获取引用此原料的客制化选项列表（分页）',
        params: ParamsWithId,
        querystring: PaginatedQuerySchema,
        response: { 200: ApiResponseSchema(IngredientOptionListResponseSchema).describe('客制化选项列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await ingredientService.getIngredientOptionList(
        request.params.id,
        request.query.page,
        request.query.pageSize,
      );
      return ApiResponse.success(data);
    },
  );

  // 获取绑定此原料的商品列表（只读，不允许原料侧写入）
  app.get(
    '/ingredients/:id/products',
    {
      schema: {
        tags: ['Ingredients'],
        description: '获取绑定此原料的商品列表（只读）',
        params: ParamsWithId,
        querystring: PaginatedQuerySchema,
        response: { 200: ApiResponseSchema(IngredientProductListResponseSchema).describe('绑定商品列表（只读）') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await ingredientService.getIngredientProductList(
        request.params.id,
        request.query.page,
        request.query.pageSize,
      );
      return ApiResponse.success(data);
    },
  );

  // 将客制化选项绑定到原料的能力已移至客制化选项侧（updateOption），
  // 原料侧仅保留只读查询，不允许写入 / 更新用量 / 解绑。
};
