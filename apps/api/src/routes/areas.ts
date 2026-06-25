import type { FastifyInstance } from 'fastify';
import {
  getTopDivisions,
  getDivisionChildren,
  matchDivisionByNames,
} from '@aurouscia/china-areas/dist/index.js';
import { AppError } from '../errorcode/index.js';
import { areaErrors } from '../errorcode/areas.js';
import type { ApiResponse, Division, ResolveAreaRequest } from '@dextea/shared-types';

export async function areaRoutes(app: FastifyInstance) {
  /** 省份列表 */
  app.get<{ Reply: ApiResponse<Division[]> }>('/areas/provinces', {
    schema: {
      description: '省份列表',
      tags: ['Areas'],
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (_request, reply) => {
    try {
      const provinces = getTopDivisions();
      return { code: 0, data: provinces, message: 'ok' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(areaErrors.PROVINCES_FAILED);
    }
  });

  /** 子级行政区划 */
  app.get<{
    Params: { code: string };
    Reply: ApiResponse<Division[]>;
  }>('/areas/:code/children', {
    schema: {
      description: '子级行政区划',
      tags: ['Areas'],
      params: {
        type: 'object',
        properties: {
          code: { type: 'string', minLength: 1, description: '地区编码' },
        },
        required: ['code'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const { code } = request.params;
      const children = getDivisionChildren(code);
      return { code: 0, data: children, message: 'ok' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(areaErrors.CHILDREN_FAILED);
    }
  });

  /** 解析地区名称 */
  app.post<{
    Body: ResolveAreaRequest;
    Reply: ApiResponse<Division[]>;
  }>('/areas/resolve', {
    schema: {
      description: '解析地区名称',
      tags: ['Areas'],
      body: {
        type: 'object',
        properties: {
          names: {
            type: 'array',
            items: { type: 'string' },
            description: '地区名称列表',
          },
        },
        required: ['names'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const { names } = request.body;
      if (!Array.isArray(names) || names.length === 0) {
        throw new AppError(areaErrors.RESOLVE_FAILED);
      }
      const result = matchDivisionByNames(names);
      return { code: 0, data: result, message: 'ok' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(areaErrors.RESOLVE_FAILED);
    }
  });
}
