import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerDashboardRoutes } from './dashboard.controller.js';

export const registerDashboardModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerDashboardRoutes, { prefix: '/api/v2' });
};
