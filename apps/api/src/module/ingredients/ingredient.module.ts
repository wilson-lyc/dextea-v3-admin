import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerIngredientRoutes } from './ingredient.controller.js';

export const registerIngredientModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerIngredientRoutes, { prefix: '/api/v1' });
};
