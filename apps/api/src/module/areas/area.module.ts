import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerAreaRoutes } from './area.controller.js';

export const registerAreaModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerAreaRoutes, { prefix: '/api/v2' });
};
