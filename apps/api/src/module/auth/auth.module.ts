import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerAuthRoutes } from './auth.controller.js';

export const registerAuthModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerAuthRoutes, { prefix: '/api/v1' });
};
