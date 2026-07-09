import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerConfigRoutes } from './config.controller.js';

export const registerConfigModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerConfigRoutes, { prefix: '/api/v1' });
};
