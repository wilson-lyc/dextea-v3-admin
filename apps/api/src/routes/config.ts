import type { FastifyInstance } from 'fastify';
import { config } from '../config/index.js';
import type { ApiResponse, AmapConfig } from '@dextea/shared-types';

export async function configRoutes(app: FastifyInstance) {
  /**
   * 高德地图密钥
   * url：/api/v1/config/amap-key
   */
  app.get<{ Reply: ApiResponse<AmapConfig> }>('/config/amap-key', async () => {
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
