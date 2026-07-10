import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerEmployeeRoutes } from './employees.controller.js';

export const registerEmployeeModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerEmployeeRoutes, { prefix: '/api/v2' });
};
