import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { initRoutes } from './init.js';
import { authRoutes } from './auth.js';
import { storeRoutes } from './stores.js';
import { areaRoutes } from './areas.js';
import { configRoutes } from './config.js';
import { productRoutes } from './products.js';
import { tagRoutes } from './tags.js';
import { productCustomizationRoutes } from './product-customizations.js';
import { ingredientRoutes } from './ingredients.js';
import { dashboardRoutes } from './dashboard.js';
import { storeStatusRoutes } from './store-status.js';
import { menuRoutes } from './menus.js';
import { authHook } from '../middleware/auth.js';

export async function registerRoutes(app: FastifyInstance) {
  // 全局认证钩子 — 除白名单路由外，所有请求都需要 Bearer token 校验
  app.addHook('preHandler', authHook);

  // Public routes (no prefix)
  await app.register(healthRoutes);

  // API v1 routes（已弃用的旧版路由层，统一前缀固定为 /api/v1，由各路由自行声明）
  await app.register(initRoutes, { prefix: '/api/v1' });
  await app.register(authRoutes, { prefix: '/api/v1' });
  await app.register(storeRoutes, { prefix: '/api/v1' });
  await app.register(areaRoutes, { prefix: '/api/v1' });
  await app.register(configRoutes, { prefix: '/api/v1' });
  await app.register(productRoutes, { prefix: '/api/v1' });
  await app.register(tagRoutes, { prefix: '/api/v1' });
  await app.register(productCustomizationRoutes, { prefix: '/api/v1' });
  await app.register(ingredientRoutes, { prefix: '/api/v1' });
  await app.register(dashboardRoutes, { prefix: '/api/v1' });
  await app.register(storeStatusRoutes, { prefix: '/api/v1' });
  await app.register(menuRoutes, { prefix: '/api/v1' });
}
