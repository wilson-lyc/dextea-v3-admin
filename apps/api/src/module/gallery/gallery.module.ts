import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerGalleryRoutes } from './gallery.controller.js';

export const registerGalleryModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(registerGalleryRoutes, { prefix: '/api/v2' });
};
