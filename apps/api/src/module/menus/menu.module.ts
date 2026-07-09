import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerMenuRoutes } from './menu.controller.js';

export const registerMenuModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerMenuRoutes, { prefix: '/api/v1' });
};
