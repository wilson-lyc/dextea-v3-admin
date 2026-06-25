import type { FastifyInstance } from 'fastify';
import { config } from '../config/index.js';
import type { ApiResponse, AmapConfig } from '@dextea/shared-types';

export async function configRoutes(app: FastifyInstance) {
  /** 高德地图密钥 */
  app.get<{ Reply: ApiResponse<AmapConfig> }>('/config/amap-key', {
    schema: {
      description: '获取高德地图密钥配置',
      tags: ['Config'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                securityCode: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    return {
      code: 0,
      data: {
        key: config.amapJsKey,
        securityCode: config.amapJsSecurityCode,
      },
      message: 'ok',
    };
  });
}
