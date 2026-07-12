import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { tagService } from './tag.service.js';
import {
  TagListRequestSchema,
  TagListResponseSchema,
  TagOptionListResponseSchema,
  CreateTagRequestSchema,
  CreateTagResponseSchema,
  UpdateTagRequestSchema,
  UpdateTagResponseSchema,
  TagProductsRequestSchema,
  TagProductsResponseSchema,
  BindProductsRequestSchema,
  UnbindProductsRequestSchema,
} from '@dextea-admin/contracts';

export const registerTagRoutes: FastifyPluginAsyncZod = async (app) => {
  // 标签选项列表（供 SelectPicker 使用）
  app.get(
    '/tags/options',
    {
      schema: {
        tags: ['Tags'],
        description: '商品标签选项列表',
        response: { 200: ApiResponseSchema(TagOptionListResponseSchema).describe('标签选项列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, _reply) => {
      const data = await tagService.getTagOptions();
      return ApiResponse.success(data);
    },
  );

  // 标签列表（分页）
  app.get(
    '/tags',
    {
      schema: {
        tags: ['Tags'],
        description: '商品标签列表',
        querystring: TagListRequestSchema,
        response: { 200: ApiResponseSchema(TagListResponseSchema).describe('标签列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await tagService.getTagList(request.query);
      return ApiResponse.success(data);
    },
  );

  // 新增标签
  app.post(
    '/tags',
    {
      schema: {
        tags: ['Tags'],
        description: '新增商品标签',
        body: CreateTagRequestSchema,
        response: { 200: ApiResponseSchema(CreateTagResponseSchema).describe('创建成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await tagService.createTag(request.body);
      return ApiResponse.success(data);
    },
  );

  // 更新标签
  app.put(
    '/tags/:id/info',
    {
      schema: {
        tags: ['Tags'],
        description: '更新商品标签',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateTagRequestSchema,
        response: { 200: ApiResponseSchema(UpdateTagResponseSchema).describe('更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await tagService.updateTag(request.params.id, request.body);
      return ApiResponse.success(data);
    },
  );

  // 获取标签绑定的商品列表（分页）
  app.get(
    '/tags/:id/products',
    {
      schema: {
        tags: ['Tags'],
        description: '获取标签绑定的商品列表',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        querystring: TagProductsRequestSchema,
        response: { 200: ApiResponseSchema(TagProductsResponseSchema).describe('已绑定的商品列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await tagService.getTagProducts(request.params.id, request.query);
      return ApiResponse.success(data);
    },
  );

  // 批量绑定商品到标签
  app.post(
    '/tags/:id/products',
    {
      schema: {
        tags: ['Tags'],
        description: '批量绑定商品到标签',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: BindProductsRequestSchema,
        response: { 200: ApiResponseSchema(z.null()).describe('绑定成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const result = await tagService.bindProductsToTag(request.params.id, request.body);
      return ApiResponse.success(null, `成功绑定 ${result.boundCount} 个商品`);
    },
  );

  // 批量解绑商品标签
  app.delete(
    '/tags/:id/products',
    {
      schema: {
        tags: ['Tags'],
        description: '批量解绑商品与标签的关联',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UnbindProductsRequestSchema,
        response: { 200: ApiResponseSchema(z.null()).describe('解绑成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await tagService.unbindProductsFromTag(request.params.id, request.body);
      return ApiResponse.success(null, '解绑成功');
    },
  );

  // 删除标签
  app.delete(
    '/tags/:id/info',
    {
      schema: {
        tags: ['Tags'],
        description: '删除商品标签',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        response: { 200: ApiResponseSchema(z.null()).describe('删除成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await tagService.deleteTag(request.params.id);
      return ApiResponse.success(null, '删除成功');
    },
  );
};
