import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerStoreRoutes } from './store.controller.js';

export const registerStoreModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerStoreRoutes, { prefix: '/api/v2' });
};
