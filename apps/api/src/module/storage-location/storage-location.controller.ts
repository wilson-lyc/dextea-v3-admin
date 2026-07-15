import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { storageLocationService } from './storage-location.service.js';
import { StorageLocationErrorCodes } from './storage-location.errorcode.js';
import {
  CreateStorageLocationRequestSchema,
  CreateStorageLocationResponseSchema,
  StorageLocationListRequestSchema,
  StorageLocationListResponseSchema,
  StorageLocationOptionsResponseSchema,
  TestStorageLocationConnectionRequestSchema,
  TestStorageLocationConnectionResponseSchema,
  UpdateStorageLocationRequestSchema,
  UpdateStorageLocationResponseSchema,
} from '@dextea-admin/contracts';

export const registerStorageLocationRoutes: FastifyPluginAsyncZod = async (app) => {
  // 列表
  app.get(
    '/storage-locations',
    {
      schema: {
        tags: ['StorageLocation'],
        description: '获取存储位置列表',
        querystring: StorageLocationListRequestSchema,
        response: {
          200: ApiResponseSchema(StorageLocationListResponseSchema).describe('存储位置列表'),
        },
      },
    },
    async (request) => {
      const data = await storageLocationService.getList(request.query);
      return ApiResponse.success(data);
    },
  );

  // 启用的下拉选项（注册在 /:id 之前，避免被参数路由命中）
  app.get(
    '/storage-locations/options',
    {
      schema: {
        tags: ['StorageLocation'],
        description: '获取启用的存储位置下拉选项',
        response: {
          200: ApiResponseSchema(StorageLocationOptionsResponseSchema).describe('下拉选项'),
        },
      },
    },
    async () => {
      const data = await storageLocationService.getOptions();
      return ApiResponse.success(data);
    },
  );

  // 测试连接（使用请求中的明文配置，不落库）
  app.post(
    '/storage-locations/test-connection',
    {
      schema: {
        tags: ['StorageLocation'],
        description: '测试存储连接（使用请求中的明文配置，不落库）',
        body: TestStorageLocationConnectionRequestSchema,
        response: {
          200: ApiResponseSchema(TestStorageLocationConnectionResponseSchema).describe('测试结果'),
        },
      },
    },
    async (request) => {
      const data = await storageLocationService.testConnection(request.body);
      return ApiResponse.success(data);
    },
  );

  // 详情
  app.get(
    '/storage-locations/:id',
    {
      schema: {
        tags: ['StorageLocation'],
        description: '获取存储位置详情',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        response: {
          200: ApiResponseSchema(UpdateStorageLocationResponseSchema).describe('存储位置详情'),
        },
      },
    },
    async (request) => {
      const data = await storageLocationService.getById(request.params.id);
      return ApiResponse.success(data);
    },
  );

  // 新增
  app.post(
    '/storage-locations',
    {
      schema: {
        tags: ['StorageLocation'],
        description: '新增存储位置',
        body: CreateStorageLocationRequestSchema,
        response: {
          200: ApiResponseSchema(CreateStorageLocationResponseSchema).describe('创建成功'),
        },
      },
    },
    async (request) => {
      const data = await storageLocationService.create(request.body);
      return ApiResponse.success(data, '创建成功');
    },
  );

  // 更新
  app.put(
    '/storage-locations/:id',
    {
      schema: {
        tags: ['StorageLocation'],
        description: '更新存储位置',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateStorageLocationRequestSchema,
        response: {
          200: ApiResponseSchema(UpdateStorageLocationResponseSchema).describe('更新成功'),
        },
      },
    },
    async (request) => {
      const data = await storageLocationService.update(request.params.id, request.body);
      return ApiResponse.success(data, '更新成功');
    },
  );

  // 删除
  app.delete(
    '/storage-locations/:id',
    {
      schema: {
        tags: ['StorageLocation'],
        description: '删除存储位置',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        response: {
          200: ApiResponseSchema(z.object({ id: z.number() })).describe('删除成功'),
        },
      },
    },
    async (request) => {
      const data = await storageLocationService.remove(request.params.id);
      return ApiResponse.success(data, '删除成功');
    },
  );
};
