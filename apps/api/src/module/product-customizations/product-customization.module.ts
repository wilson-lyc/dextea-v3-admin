import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerProductCustomizationRoutes } from './product-customization.controller.js';

export const registerProductCustomizationModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerProductCustomizationRoutes, { prefix: '/api/v1' });
};
