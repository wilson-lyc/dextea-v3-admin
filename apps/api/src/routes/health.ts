import type { FastifyInstance } from 'fastify';
import type { HealthResponse } from '@dextea/shared-types';

export async function healthRoutes(app: FastifyInstance) {
  /** 健康检查 */
  app.get<{ Reply: HealthResponse }>('/health', {
    schema: {
      description: '健康检查',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  });
}
