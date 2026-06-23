import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { initRoutes } from './init.js';
import { authRoutes } from './auth.js';
import { userRoutes } from './users.js';
import { storeRoutes } from './stores.js';
import { areaRoutes } from './areas.js';
import { configRoutes } from './config.js';
import { config } from '../config/index.js';

export async function registerRoutes(app: FastifyInstance) {
  // Public routes (no prefix)
  await app.register(healthRoutes);

  // API v1 routes
  await app.register(initRoutes, { prefix: config.apiPrefix });
  await app.register(authRoutes, { prefix: config.apiPrefix });
  await app.register(userRoutes, { prefix: config.apiPrefix });
  await app.register(storeRoutes, { prefix: config.apiPrefix });
  await app.register(areaRoutes, { prefix: config.apiPrefix });
  await app.register(configRoutes, { prefix: config.apiPrefix });
}
