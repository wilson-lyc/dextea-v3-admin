import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerCustomerRoutes } from './customers.controller.js';

export const registerCustomerModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerCustomerRoutes, { prefix: '/api/v2' });
};
