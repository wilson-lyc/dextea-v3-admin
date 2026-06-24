import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { initRoutes } from './init.js';
import { authRoutes } from './auth.js';
import { userRoutes } from './users.js';
import { storeRoutes } from './stores.js';
import { areaRoutes } from './areas.js';
import { configRoutes } from './config.js';
import { productRoutes } from './products.js';
import { tagRoutes } from './tags.js';
import { dashboardRoutes } from './dashboard.js';
import { config } from '../config/index.js';
import { authHook } from '../middleware/auth.js';

export async function registerRoutes(app: FastifyInstance) {
  // 全局认证钩子 — 除白名单路由外，所有请求都需要 Bearer token 校验
  app.addHook('preHandler', authHook);

  // Public routes (no prefix)
  await app.register(healthRoutes);

  // API v1 routes
  await app.register(initRoutes, { prefix: config.apiPrefix });
  await app.register(authRoutes, { prefix: config.apiPrefix });
  await app.register(userRoutes, { prefix: config.apiPrefix });
  await app.register(storeRoutes, { prefix: config.apiPrefix });
  await app.register(areaRoutes, { prefix: config.apiPrefix });
  await app.register(configRoutes, { prefix: config.apiPrefix });
  await app.register(productRoutes, { prefix: config.apiPrefix });
  await app.register(tagRoutes, { prefix: config.apiPrefix });
  await app.register(dashboardRoutes, { prefix: config.apiPrefix });
}
