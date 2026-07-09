import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerStoreStatusRoutes } from './store-status.controller.js';

export const registerStoreStatusModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerStoreStatusRoutes, { prefix: '/api/v1' });
};
