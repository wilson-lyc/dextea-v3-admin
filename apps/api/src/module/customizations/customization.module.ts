import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerCustomizationRoutes } from './customization.controller.js';

export const registerCustomizationModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerCustomizationRoutes, { prefix: '/api/v2' });
};
