import type { FastifyInstance } from 'fastify';
import {
  getTopDivisions,
  getDivisionChildren,
  matchDivisionByNames,
} from '@aurouscia/china-areas/dist/index.js';

export async function areaRoutes(app: FastifyInstance) {
  app.get('/areas/provinces', async (_request, reply) => {
    try {
      const provinces = getTopDivisions();
      return { code: 0, data: provinces, message: 'ok' };
    } catch (error) {
      return reply.status(500).send({ code: 1, data: null, message: '获取省份列表失败' });
    }
  });

  app.get<{
    Params: { code: string };
  }>('/areas/:code/children', async (request, reply) => {
    try {
      const { code } = request.params;
      const children = getDivisionChildren(code);
      return { code: 0, data: children, message: 'ok' };
    } catch (error) {
      return reply.status(500).send({ code: 1, data: null, message: '获取子级地区失败' });
    }
  });

  app.post<{
    Body: { names: string[] };
  }>('/areas/resolve', async (request, reply) => {
    try {
      const { names } = request.body;
      const result = matchDivisionByNames(names);
      return { code: 0, data: result, message: 'ok' };
    } catch (error) {
      return reply.status(500).send({ code: 1, data: null, message: '解析地区失败' });
    }
  });
}
