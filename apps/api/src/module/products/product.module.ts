import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerProductRoutes } from './product.controller.js';

export const registerProductModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerProductRoutes, { prefix: '/api/v2' });
};
