import Fastify, { type FastifyError } from 'fastify';
import { config } from './config/index.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { ApiResponse } from '@/common/types/index.js';
import { SystemErrorCodes } from '@/module/system/system.errorcode.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      transport: config.isDev
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  app.setSchemaErrorFormatter((errors, dataVar) => {
    const err = errors[0];
    if (!err) return new Error('请求参数校验失败');

    let message: string;
    switch (err.keyword) {
      case 'required': {
        const field = (err.params as { missingProperty?: string }).missingProperty ?? '';
        message = `缺少必填字段「${field}」`;
        break;
      }
      case 'type': {
        const field = err.instancePath.replace(/^\//, '');
        message = field ? `「${field}」格式不正确` : '请求参数格式不正确';
        break;
      }
      case 'minLength': {
        const field = err.instancePath.replace(/^\//, '');
        message = `「${field}」不能为空`;
        break;
      }
      case 'minimum':
      case 'maximum': {
        const field = err.instancePath.replace(/^\//, '');
        message = `「${field}」超出范围`;
        break;
      }
      case 'enum': {
        const field = err.instancePath.replace(/^\//, '');
        message = `「${field}」的值无效`;
        break;
      }
      default:
        message = err.message ?? '请求参数校验失败';
    }

    return new Error(message);
  });

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof BizError) {
      return reply.status(error.httpStatus).send(
        ApiResponse.error(error.code, error.message)
      );
    }

    // Fastify 验证错误
    if (error.validation) {
      return reply.status(400).send(
        ApiResponse.error(400, error.message)
      );
    }

    // 未知错误
    reply.log.error(error);
    return reply.status(500).send(
      ApiResponse.error(SystemErrorCodes.INTERNAL_ERROR.code, SystemErrorCodes.INTERNAL_ERROR.message)
    );
  });

  await registerPlugins(app);

  await registerRoutes(app);

  return app;
}
