import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerInitRoutes } from './init.controller.js';

export const registerInitModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerInitRoutes, { prefix: '/api/v1' });
};
