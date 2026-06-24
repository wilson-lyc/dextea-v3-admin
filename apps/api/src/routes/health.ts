import type { FastifyInstance } from 'fastify';
import type { HealthResponse } from '@dextea/shared-types';

export async function healthRoutes(app: FastifyInstance) {
  /**
   * 健康检查
   * url：/health
   */
  app.get<{ Reply: HealthResponse }>('/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
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
