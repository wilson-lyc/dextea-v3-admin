import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerTagRoutes } from './tag.controller.js';

export const registerTagModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerTagRoutes, { prefix: '/api/v1' });
};
