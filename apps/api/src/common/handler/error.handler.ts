import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { BizError } from '../exceptions/biz-error.exception';
import { ApiResponse } from '@/common/types';
import { SystemErrorCodes } from '@/common/constants/error-code.constant';

/**
 * 全局异常处理
 * 统一兜底所有拦截层与业务层抛出的异常，保证响应格式一致。
 */
export function globalErrorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  // 业务异常（含鉴权 401）
  if (error instanceof BizError) {
    return reply.status(error.httpStatus).send(
      ApiResponse.error(error.code, error.message),
    );
  }

  // Fastify 验证错误（Zod 参数校验失败）
  if (error.validation) {
    return reply.status(400).send(
      ApiResponse.error(400, error.message),
    );
  }

  // 未知错误
  reply.log.error(error);
  return reply.status(500).send(
    ApiResponse.error(
      SystemErrorCodes.INTERNAL_ERROR.code,
      SystemErrorCodes.INTERNAL_ERROR.message,
    ),
  );
}
