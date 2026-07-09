import Fastify, { type FastifyError } from 'fastify';
import { config } from './config/index.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { SystemErrorCodes } from './errorcode/system.js';

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

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof BizError) {
      request.log.warn({ code: error.code, err: error.message }, 'BizError');
      return reply.status(error.httpStatus).send(error.toResponse());
    }

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      'httpStatus' in error &&
      typeof (error as BizError).toResponse === 'function'
    ) {
      const bizErr = error as BizError;
      request.log.warn({ code: bizErr.code, err: bizErr.message }, 'BizError (structural)');
      return reply.status(bizErr.httpStatus).send(bizErr.toResponse());
    }

    const fErr = error as FastifyError;
    if (fErr.validation) {
      request.log.warn({ validation: fErr.validation, err: fErr.message }, 'Validation Error');
      return reply.status(200).send({
        code: SystemErrorCodes.INVALID_REQUEST.code,
        data: null,
        message: fErr.message,
      });
    }

    request.log.error(error);
    const message = error instanceof Error ? error.message : SystemErrorCodes.INTERNAL_ERROR.message;
    return reply.status(500).send({
      code: SystemErrorCodes.INTERNAL_ERROR.code,
      data: null,
      message,
    });
  });

  await registerPlugins(app);

  await registerRoutes(app);

  return app;
}
