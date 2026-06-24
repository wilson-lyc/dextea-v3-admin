import Fastify from 'fastify';
import { config } from './config/index.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';
import { AppError } from './errorcode/index.js';
import { systemErrors } from './errorcode/system.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      transport: config.isDev
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  // 注册插件
  await registerPlugins(app);

  // 注册路由
  await registerRoutes(app);

  // 全局错误处理 — 捕获 AppError 并返回统一响应格式
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      request.log.warn({ code: error.code, err: error.message }, 'AppError');
      return reply.status(error.httpStatus).send(error.toResponse());
    }

    request.log.error(error);
    const message = error instanceof Error ? error.message : systemErrors.INTERNAL_ERROR.message;
    return reply.status(500).send({
      code: systemErrors.INTERNAL_ERROR.code,
      data: null,
      message,
    });
  });

  return app;
}
