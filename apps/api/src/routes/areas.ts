import type { FastifyInstance } from 'fastify';
import {
  getTopDivisions,
  getDivisionChildren,
  matchDivisionByNames,
} from '@aurouscia/china-areas/dist/index.js';
import { AppError } from '../errorcode/index.js';
import { areaErrors } from '../errorcode/areas.js';
import { validateRequired } from '../utils/validation.js';
import type { ApiResponse, Division, ResolveAreaRequest } from '@dextea/shared-types';

export async function areaRoutes(app: FastifyInstance) {
  /**
   * 省份列表
   * url：/api/v1/areas/provinces
   */
  app.get<{ Reply: ApiResponse<Division[]> }>('/areas/provinces', async (_request, reply) => {
    try {
      const provinces = getTopDivisions();
      return { code: 0, data: provinces, message: 'ok' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(areaErrors.PROVINCES_FAILED);
    }
  });

  /**
   * 子级行政区划
   * url：/api/v1/areas/:code/children
   */
  app.get<{
    Params: { code: string };
    Reply: ApiResponse<Division[]>;
  }>('/areas/:code/children', async (request, reply) => {
    try {
      const { code } = request.params;
      validateRequired(code, '地区编码');
      const children = getDivisionChildren(code);
      return { code: 0, data: children, message: 'ok' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(areaErrors.CHILDREN_FAILED);
    }
  });

  /**
   * 解析地区名称
   * url：/api/v1/areas/resolve
   */
  app.post<{
    Body: ResolveAreaRequest;
    Reply: ApiResponse<Division[]>;
  }>('/areas/resolve', async (request, reply) => {
    try {
      const { names } = request.body;
      validateRequired(names, '地区名称列表');
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
