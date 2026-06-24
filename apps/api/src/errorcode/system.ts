import type { BizError } from './index.js';

/**
 * 系统级通用错误码 (1000-1099)
 */
export const systemErrors = {
  INTERNAL_ERROR: {
    code: 1000,
    message: '服务器内部错误，请稍后重试',
    httpStatus: 500,
  } satisfies BizError,

  UNKNOWN_ERROR: {
    code: 1001,
    message: '未知错误',
    httpStatus: 500,
  } satisfies BizError,

  DATABASE_ERROR: {
    code: 1002,
    message: '数据库操作失败，请稍后重试',
    httpStatus: 500,
  } satisfies BizError,

  REDIS_ERROR: {
    code: 1003,
    message: '缓存服务异常',
    httpStatus: 500,
  } satisfies BizError,

  INVALID_REQUEST: {
    code: 1004,
    message: '请求参数无效',
    httpStatus: 400,
  } satisfies BizError,

  NOT_FOUND: {
    code: 1005,
    message: '请求的资源不存在',
    httpStatus: 404,
  } satisfies BizError,

  FORBIDDEN: {
    code: 1006,
    message: '没有权限执行该操作',
    httpStatus: 403,
  } satisfies BizError,

  VALIDATION_ERROR: {
    code: 1007,
    message: '数据校验失败',
    httpStatus: 400,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
