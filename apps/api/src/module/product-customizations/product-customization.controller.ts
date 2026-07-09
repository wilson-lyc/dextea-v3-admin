import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { productCustomizationService } from './product-customization.service.js';
import {
  ProductCustomizationListRequestSchema,
  ProductCustomizationListResponseSchema,
  ProductCustomizationGetResponseSchema,
  CreateProductCustomizationRequestSchema,
  CreateProductCustomizationResponseSchema,
  UpdateProductCustomizationRequestSchema,
  UpdateProductCustomizationResponseSchema,
  UpdateProductCustomizationStatusRequestSchema,
  UpdateProductCustomizationStatusResponseSchema,
  CustomizationOptionListResponseSchema,
  CreateCustomizationOptionRequestSchema,
  CreateCustomizationOptionResponseSchema,
  UpdateCustomizationOptionRequestSchema,
  UpdateCustomizationOptionResponseSchema,
  DeleteCustomizationOptionResponseSchema,
} from './product-customization.type.js';

const ParamIdSchema = z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') });
const ParamIdOptionIdSchema = z.object({
  id: z.coerce.number().int().positive('ID 必须为正整数'),
  optionId: z.coerce.number().int().positive('选项ID必须为正整数'),
});

export const registerProductCustomizationRoutes: FastifyPluginAsyncZod = async (app) => {
  // 客制化项目列表
  app.get(
    '/product-customizations',
    {
      schema: {
        tags: ['Product Customizations'],
        description: '客制化项目列表',
        querystring: ProductCustomizationListRequestSchema,
        response: { 200: ApiResponseSchema(ProductCustomizationListResponseSchema).describe('客制化项目列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productCustomizationService.getCustomizationList(request.query);
      return ApiResponse.success(data);
    },
  );

  // 客制化项目详情
  app.get(
    '/product-customizations/:id',
    {
      schema: {
        tags: ['Product Customizations'],
        description: '客制化项目详情',
        params: ParamIdSchema,
        response: { 200: ApiResponseSchema(ProductCustomizationGetResponseSchema).describe('客制化项目详情') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productCustomizationService.getCustomizationById(request.params.id);
      return ApiResponse.success(data);
    },
  );

  // 创建客制化项目
  app.post(
    '/product-customizations',
    {
      schema: {
        tags: ['Product Customizations'],
        description: '创建客制化项目',
        body: CreateProductCustomizationRequestSchema,
        response: { 200: ApiResponseSchema(CreateProductCustomizationResponseSchema).describe('创建成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productCustomizationService.createCustomization(request.body);
      return ApiResponse.success(data, '创建成功');
    },
  );

  // 更新客制化项目基础信息
  app.patch(
    '/product-customizations/:id',
    {
      schema: {
        tags: ['Product Customizations'],
        description: '更新客制化项目基础信息',
        params: ParamIdSchema,
        body: UpdateProductCustomizationRequestSchema,
        response: { 200: ApiResponseSchema(UpdateProductCustomizationResponseSchema).describe('更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productCustomizationService.updateCustomization(request.params.id, request.body);
      return ApiResponse.success(data, '更新成功');
    },
  );

  // 单独更新客制化项目状态
  app.patch(
    '/product-customizations/:id/status',
    {
      schema: {
        tags: ['Product Customizations'],
        description: '单独更新客制化项目状态',
        params: ParamIdSchema,
        body: UpdateProductCustomizationStatusRequestSchema,
        response: { 200: ApiResponseSchema(UpdateProductCustomizationStatusResponseSchema).describe('状态更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productCustomizationService.updateCustomizationStatus(request.params.id, request.body);
      return ApiResponse.success(data, '状态更新成功');
    },
  );

  // 获取客制化选项列表
  app.get(
    '/product-customizations/:id/options',
    {
      schema: {
        tags: ['Product Customizations'],
        description: '获取客制化选项列表',
        params: ParamIdSchema,
        response: { 200: ApiResponseSchema(CustomizationOptionListResponseSchema).describe('客制化选项列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productCustomizationService.getOptionList(request.params.id);
      return ApiResponse.success(data);
    },
  );

  // 创建客制化选项
  app.post(
    '/product-customizations/:id/options',
    {
      schema: {
        tags: ['Product Customizations'],
        description: '创建客制化选项',
        params: ParamIdSchema,
        body: CreateCustomizationOptionRequestSchema,
        response: { 200: ApiResponseSchema(CreateCustomizationOptionResponseSchema).describe('创建成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productCustomizationService.createOption(request.params.id, request.body);
      return ApiResponse.success(data, '创建成功');
    },
  );

  // 更新客制化选项
  app.put(
    '/product-customizations/:id/options/:optionId',
    {
      schema: {
        tags: ['Product Customizations'],
        description: '更新客制化选项',
        params: ParamIdOptionIdSchema,
        body: UpdateCustomizationOptionRequestSchema,
        response: { 200: ApiResponseSchema(UpdateCustomizationOptionResponseSchema).describe('更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await productCustomizationService.updateOption(
        request.params.id,
        request.params.optionId,
        request.body,
      );
      return ApiResponse.success(data, '更新成功');
    },
  );

  // 删除客制化选项
  app.delete(
    '/product-customizations/:id/options/:optionId',
    {
      schema: {
        tags: ['Product Customizations'],
        description: '删除客制化选项',
        params: ParamIdOptionIdSchema,
        response: { 200: ApiResponseSchema(DeleteCustomizationOptionResponseSchema).describe('删除成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await productCustomizationService.deleteOption(request.params.id, request.params.optionId);
      return ApiResponse.success(null, '删除成功');
    },
  );
};
