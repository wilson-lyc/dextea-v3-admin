import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerStoreCatalogRoutes } from './store-catalog.controller.js';

export const registerStoreCatalogModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerStoreCatalogRoutes, { prefix: '/api/v2' });
};
