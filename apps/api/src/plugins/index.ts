import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import redis from '@fastify/redis';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import mailPlugin from './mail.js';
import { config } from '../config/index.js';

export async function registerPlugins(app: FastifyInstance) {
  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  });

  await app.register(redis, {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'DexTea Admin API',
        description: 'DexTea 茶饮连锁管理系统后端接口文档',
        version: '0.0.1',
      },
      servers: [
        {
          url: `http://localhost:${config.port}`,
          description: '开发服务器',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: '输入 Bearer token（登录接口返回的 token 值）',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: `${config.apiPrefix}/docs`,
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      defaultModelsExpandDepth: 3,
    },
  });

  await app.register(mailPlugin);
}
