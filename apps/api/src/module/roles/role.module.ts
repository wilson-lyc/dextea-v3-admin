import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerRoleRoutes } from './role.controller.js';

export const registerRoleModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerRoleRoutes, { prefix: '/api/v2' });
};
