import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { initRoutes } from './init.js';
import { config } from '../config/index.js';

export async function registerRoutes(app: FastifyInstance) {
  // Public routes (no prefix)
  await app.register(healthRoutes);

  // API v1 routes
  await app.register(initRoutes, { prefix: config.apiPrefix });
}
