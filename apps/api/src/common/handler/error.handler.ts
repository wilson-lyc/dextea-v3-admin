import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { BizError } from '../exceptions/biz-error.exception';
import { ApiResponse } from '@/common/types';
import { SystemErrorCodes } from '@/common/constants/error-code.constant';
import { isSystemError } from '@/utils/system-error.js';

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
    // 业务错误统一以 HTTP 200 返回，错误语义由响应体 code 承载，
    // 前端据此在成功回调中区分成败。仅鉴权类（401）保留原状态码以触发登录跳转。
    const status = error.httpStatus === 401 ? 401 : 200;
    return reply.status(status).send(
      ApiResponse.error(error.code, error.message),
    );
  }

  // Fastify 验证错误（Zod 参数校验失败）
  if (error.validation) {
    return reply.status(400).send(
      ApiResponse.error(400, error.message),
    );
  }

  // 底层基础设施异常（数据库错误 / Redis 错误 / 网络错误等）：
  // 统一兜住，避免将原始错误细节暴露给用户，返回「服务器内部异常」。
  if (isSystemError(error)) {
    reply.log.error(error, '系统内部异常（数据库或缓存）');
    return reply.status(500).send(
      ApiResponse.error(
        SystemErrorCodes.INTERNAL_ERROR.code,
        SystemErrorCodes.INTERNAL_ERROR.message,
      ),
    );
  }

  // 其余未知错误
  reply.log.error(error);
  return reply.status(500).send(
    ApiResponse.error(
      SystemErrorCodes.INTERNAL_ERROR.code,
      SystemErrorCodes.INTERNAL_ERROR.message,
    ),
  );
}
