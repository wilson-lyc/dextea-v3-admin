import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerPermissionRoutes } from './permission.controller.js';

export const registerPermissionModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerPermissionRoutes, { prefix: '/api/v2' });
};
