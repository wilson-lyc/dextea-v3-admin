import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { areaService } from './area.service.js';
import {
  AreaListResponseSchema,
  AreaChildrenParamsSchema,
  ResolveAreaRequestSchema,
  ResolveAreaResponseSchema,
} from '@dextea-admin/contracts';

export const registerAreaRoutes: FastifyPluginAsyncZod = async (app) => {
  // 省份列表
  app.get(
    '/areas/provinces',
    {
      schema: {
        tags: ['Areas'],
        description: '省份列表',
        response: {
          200: ApiResponseSchema(AreaListResponseSchema).describe('省份列表'),
        },
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, _reply) => {
      const data = await areaService.getProvinceList();
      return ApiResponse.success(data);
    },
  );

  // 子级行政区划
  app.get(
    '/areas/:code/children',
    {
      schema: {
        tags: ['Areas'],
        description: '子级行政区划',
        params: AreaChildrenParamsSchema,
        response: {
          200: ApiResponseSchema(AreaListResponseSchema).describe('子级地区列表'),
        },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await areaService.getChildren(request.params.code);
      return ApiResponse.success(data);
    },
  );

  // 解析地区名称
  app.post(
    '/areas/resolve',
    {
      schema: {
        tags: ['Areas'],
        description: '解析地区名称',
        body: ResolveAreaRequestSchema,
        response: {
          200: ApiResponseSchema(ResolveAreaResponseSchema).describe('解析结果'),
        },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await areaService.resolveAreas(request.body.names);
      return ApiResponse.success(data);
    },
  );

  // 行政区划链路（从顶级到指定代码，用于反查省/市/区）
  app.get(
    '/areas/:code/path',
    {
      schema: {
        tags: ['Areas'],
        description: '行政区划链路（从顶级到指定代码）',
        params: AreaChildrenParamsSchema,
        response: {
          200: ApiResponseSchema(AreaListResponseSchema).describe('行政区划链路'),
        },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await areaService.getDivisionPath(request.params.code);
      return ApiResponse.success(data);
    },
  );
};
