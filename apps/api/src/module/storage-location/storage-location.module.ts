import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerStorageLocationRoutes } from './storage-location.controller.js';

export const registerStorageLocationModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerStorageLocationRoutes, { prefix: '/api/v2' });
};
