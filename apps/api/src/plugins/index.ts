import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { config } from '../config/index.js';

export async function registerPlugins(app: FastifyInstance) {
  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });
}
