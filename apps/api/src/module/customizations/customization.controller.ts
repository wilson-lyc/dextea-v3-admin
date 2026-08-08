import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { customizationService } from './customization.service.js';
import {
  CustomizationListRequestSchema,
  CustomizationListResponseSchema,
  CreateCustomizationRequestSchema,
  CreateCustomizationResponseSchema,
  UpdateCustomizationRequestSchema,
  UpdateCustomizationResponseSchema,
  UpdateCustomizationStatusRequestSchema,
  UpdateCustomizationStatusResponseSchema,
  BatchUpdateCustomizationStatusRequestSchema,
  BatchUpdateCustomizationStatusResponseSchema,
  CustomizationOptionListResponseSchema,
  CreateCustomizationOptionRequestSchema,
  CreateCustomizationOptionResponseSchema,
  UpdateCustomizationOptionRequestSchema,
  UpdateCustomizationOptionResponseSchema,
  UpdateCustomizationOptionStatusRequestSchema,
  UpdateCustomizationOptionStatusResponseSchema,
  BatchUpdateCustomizationOptionStatusRequestSchema,
  BatchUpdateCustomizationOptionStatusResponseSchema,
  UpdateCustomizationOptionQuantityRequestSchema,
  UpdateCustomizationOptionQuantityResponseSchema,
  RebindCustomizationOptionIngredientRequestSchema,
  RebindCustomizationOptionIngredientResponseSchema,
  ExportCustomizationRequestSchema,
  ExportCustomizationResponseSchema,
  ImportCustomizationRequestSchema,
  ImportCustomizationResponseSchema,
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

  // 更新客制化项目
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

  // 批量更新客制化项目状态
  app.post(
    '/customizations/batch/status',
    {
      schema: {
        tags: ['Customizations'],
        description: '批量更新客制化项目状态（上架/下架）',
        body: BatchUpdateCustomizationStatusRequestSchema,
        response: { 200: ApiResponseSchema(BatchUpdateCustomizationStatusResponseSchema).describe('批量更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.batchUpdateCustomizationStatus(request.body);
      return ApiResponse.success(data, '批量更新客制化项目状态成功');
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

  // 单独更新客制化选项状态（激活/禁用）
  app.patch(
    '/customizations/:id/options/:optionId/status',
    {
      schema: {
        tags: ['Customizations'],
        description: '单独更新客制化选项状态（激活/禁用）',
        params: ParamIdOptionIdSchema,
        body: UpdateCustomizationOptionStatusRequestSchema,
        response: { 200: ApiResponseSchema(UpdateCustomizationOptionStatusResponseSchema).describe('状态更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.updateOptionStatus(
        request.params.id,
        request.params.optionId,
        request.body.status,
      );
      return ApiResponse.success(data, '状态更新成功');
    },
  );

  // 批量更新客制化选项状态（激活/禁用）
  app.post(
    '/customizations/:id/options/batch/status',
    {
      schema: {
        tags: ['Customizations'],
        description: '批量更新客制化选项状态（激活/禁用）',
        params: ParamIdSchema,
        body: BatchUpdateCustomizationOptionStatusRequestSchema,
        response: { 200: ApiResponseSchema(BatchUpdateCustomizationOptionStatusResponseSchema).describe('批量更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.batchUpdateOptionStatus(request.body);
      return ApiResponse.success(data, '批量更新客制化选项状态成功');
    },
  );

  // 单独更新客制化选项绑定用量
  app.patch(
    '/customizations/:id/options/:optionId/quantity',
    {
      schema: {
        tags: ['Customizations'],
        description: '更新客制化选项绑定原料的用量',
        params: ParamIdOptionIdSchema,
        body: UpdateCustomizationOptionQuantityRequestSchema,
        response: { 200: ApiResponseSchema(UpdateCustomizationOptionQuantityResponseSchema).describe('更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.updateOptionQuantity(
        request.params.id,
        request.params.optionId,
        request.body.quantity,
      );
      return ApiResponse.success(data, '更新成功');
    },
  );

  // 换绑客制化选项原料（换绑到新原料或解绑）
  app.patch(
    '/customizations/:id/options/:optionId/ingredient',
    {
      schema: {
        tags: ['Customizations'],
        description: '换绑客制化选项原料（含新用量），或解绑',
        params: ParamIdOptionIdSchema,
        body: RebindCustomizationOptionIngredientRequestSchema,
        response: { 200: ApiResponseSchema(RebindCustomizationOptionIngredientResponseSchema).describe('换绑成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.rebindOptionIngredient(
        request.params.id,
        request.params.optionId,
        request.body.ingredientId,
        request.body.quantity,
      );
      return ApiResponse.success(data, '换绑成功');
    },
  );

  // 导出客制化配置（按选中的项目批量导出，仅含项目名称与选项的 名称/价格/排序）
  app.post(
    '/customizations/export',
    {
      schema: {
        tags: ['Customizations'],
        description: '导出选中的客制化配置为可复用 JSON',
        body: ExportCustomizationRequestSchema,
        response: { 200: ApiResponseSchema(ExportCustomizationResponseSchema).describe('客制化配置导出结果') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.exportCustomization(request.body);
      return ApiResponse.success(data);
    },
  );

  // 导入客制化配置（到目标商品，导入后项目和选项均默认为禁用）
  app.post(
    '/customizations/import',
    {
      schema: {
        tags: ['Customizations'],
        description: '导入客制化配置到目标商品（项目与选项默认禁用）',
        body: ImportCustomizationRequestSchema,
        response: { 200: ApiResponseSchema(ImportCustomizationResponseSchema).describe('导入结果') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await customizationService.importCustomization(request.body);
      return ApiResponse.success(data, '导入成功');
    },
  );
};
