import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { config } from '../config/index.js';

export async function registerRoutes(app: FastifyInstance) {
  // Public routes (no prefix)
  await app.register(healthRoutes);

  // API v1 routes
  // await app.register(/* v1 routes */, { prefix: config.apiPrefix });
}
