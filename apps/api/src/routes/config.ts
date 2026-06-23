import type { FastifyInstance } from 'fastify';
import { config } from '../config/index.js';

export async function configRoutes(app: FastifyInstance) {
  app.get('/config/amap-key', async () => {
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
