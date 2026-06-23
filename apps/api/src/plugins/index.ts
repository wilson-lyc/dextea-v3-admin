import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import redis from '@fastify/redis';
import mailPlugin from './mail.js';
import { config } from '../config/index.js';

export async function registerPlugins(app: FastifyInstance) {
  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  await app.register(redis, {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
  });

  await app.register(mailPlugin);
}
