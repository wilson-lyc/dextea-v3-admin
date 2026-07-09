import Redis from 'ioredis';
import redisPlugin from '@fastify/redis';
import type { FastifyInstance } from 'fastify';
import { config } from '@/config';

const { host, port, password, db } = config.redis;

export const redis = new Redis({
  host,
  port,
  password: password || undefined,
  db,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  console.error('[Redis] 连接错误:', err.message);
});

export async function registerRedis(app: FastifyInstance) {
  await app.register(redisPlugin, {
    client: redis,
    closeClient: true,
  });
}
