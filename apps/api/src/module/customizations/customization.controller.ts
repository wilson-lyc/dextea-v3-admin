import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { customizationService } from './customization.service.js';
import {
  CustomizationListRequestSchema,
  CustomizationListResponseSchema,
  CustomizationGetResponseSchema,
  CreateCustomizationRequestSchema,
  CreateCustomizationResponseSchema,
  UpdateCustomizationRequestSchema,
  UpdateCustomizationResponseSchema,
  UpdateCustomizationStatusRequestSchema,
  UpdateCustomizationStatusResponseSchema,
  CustomizationOptionListResponseSchema,
  CreateCustomizationOptionRequestSchema,
  CreateCustomizationOptionResponseSchema,
  UpdateCustomizationOptionRequestSchema,
  UpdateCustomizationOptionResponseSchema,
  DeleteCustomizationOptionResponseSchema,
} from '@dextea-admin/contracts';

const ParamIdSchema = z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') });
const ParamIdOptionIdSchema = z.object({
  id: z.coerce.number().int().positive('ID 必须为正整数'),
  optionId: z.coerce.number().int().positive('选项ID必须为正整数'),
});

export const registerCustomizationRoutes: FastifyPluginAsyncZod = async (app) => {
  // 客制化项目列表
  app.get(
    '/customizations',
    {
      schema: {
        tags: ['Customizations'],
        description: '客制化项目列表',
        querystring: CustomizationListRequestSchema,
        response: { 200: ApiResponseSchema(CustomizationListResponseSchema).describe('客制化项目列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.getCustomizationList(request.query);
      return ApiResponse.success(data);
    },
  );

  // 客制化项目详情
  app.get(
    '/customizations/:id/info',
    {
      schema: {
        tags: ['Customizations'],
        description: '客制化项目详情',
        params: ParamIdSchema,
        response: { 200: ApiResponseSchema(CustomizationGetResponseSchema).describe('客制化项目详情') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.getCustomizationById(request.params.id);
      return ApiResponse.success(data);
    },
  );

  // 创建客制化项目
  app.post(
    '/customizations',
    {
      schema: {
        tags: ['Customizations'],
        description: '创建客制化项目',
        body: CreateCustomizationRequestSchema,
        response: { 200: ApiResponseSchema(CreateCustomizationResponseSchema).describe('创建成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.createCustomization(request.body);
      return ApiResponse.success(data, '创建成功');
    },
  );

  // 更新客制化项目（全量替换）
  app.put(
    '/customizations/:id/info',
    {
      schema: {
        tags: ['Customizations'],
        description: '更新客制化项目基础信息',
        params: ParamIdSchema,
        body: UpdateCustomizationRequestSchema,
        response: { 200: ApiResponseSchema(UpdateCustomizationResponseSchema).describe('更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.updateCustomization(request.params.id, request.body);
      return ApiResponse.success(data, '更新成功');
    },
  );

  // 单独更新客制化项目状态
  app.patch(
    '/customizations/:id/status',
    {
      schema: {
        tags: ['Customizations'],
        description: '单独更新客制化项目状态',
        params: ParamIdSchema,
        body: UpdateCustomizationStatusRequestSchema,
        response: { 200: ApiResponseSchema(UpdateCustomizationStatusResponseSchema).describe('状态更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.updateCustomizationStatus(request.params.id, request.body);
      return ApiResponse.success(data, '状态更新成功');
    },
  );

  // 获取客制化选项列表
  app.get(
    '/customizations/:id/options',
    {
      schema: {
        tags: ['Customizations'],
        description: '获取客制化选项列表',
        params: ParamIdSchema,
        response: { 200: ApiResponseSchema(CustomizationOptionListResponseSchema).describe('客制化选项列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.getOptionList(request.params.id);
      return ApiResponse.success(data);
    },
  );

  // 创建客制化选项
  app.post(
    '/customizations/:id/options',
    {
      schema: {
        tags: ['Customizations'],
        description: '创建客制化选项',
        params: ParamIdSchema,
        body: CreateCustomizationOptionRequestSchema,
        response: { 200: ApiResponseSchema(CreateCustomizationOptionResponseSchema).describe('创建成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.createOption(request.params.id, request.body);
      return ApiResponse.success(data, '创建成功');
    },
  );

  // 更新客制化选项
  app.put(
    '/customizations/:id/options/:optionId',
    {
      schema: {
        tags: ['Customizations'],
        description: '更新客制化选项',
        params: ParamIdOptionIdSchema,
        body: UpdateCustomizationOptionRequestSchema,
        response: { 200: ApiResponseSchema(UpdateCustomizationOptionResponseSchema).describe('更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.updateOption(
        request.params.id,
        request.params.optionId,
        request.body,
      );
      return ApiResponse.success(data, '更新成功');
    },
  );

  // 删除客制化选项
  app.delete(
    '/customizations/:id/options/:optionId',
    {
      schema: {
        tags: ['Customizations'],
        description: '删除客制化选项',
        params: ParamIdOptionIdSchema,
        response: { 200: ApiResponseSchema(DeleteCustomizationOptionResponseSchema).describe('删除成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await customizationService.deleteOption(request.params.id, request.params.optionId);
      return ApiResponse.success(null, '删除成功');
    },
  );
};
