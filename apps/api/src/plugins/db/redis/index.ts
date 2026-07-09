import redis from '@fastify/redis';
import type { FastifyInstance } from 'fastify';
import { config } from '../../../config/index.js';

export async function registerRedis(app: FastifyInstance) {
  await app.register(redis, {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
  });
}
