import type { BizError } from './index.js';

/**
 * 系统级通用错误码 (1000-1099)
 */
export const systemErrors = {
  INTERNAL_ERROR: {
    code: 10000,
    message: '服务器内部错误，请稍后重试',
    httpStatus: 500,
  } satisfies BizError,

  UNKNOWN_ERROR: {
    code: 10001,
    message: '未知错误',
    httpStatus: 500,
  } satisfies BizError,

  DATABASE_ERROR: {
    code: 10002,
    message: '数据库操作失败，请稍后重试',
    httpStatus: 500,
  } satisfies BizError,

  REDIS_ERROR: {
    code: 10003,
    message: '缓存服务异常',
    httpStatus: 500,
  } satisfies BizError,

  INVALID_REQUEST: {
    code: 10004,
    message: '请求参数无效',
    httpStatus: 200,
  } satisfies BizError,

  NOT_FOUND: {
    code: 10005,
    message: '请求的资源不存在',
    httpStatus: 200,
  } satisfies BizError,

  FORBIDDEN: {
    code: 10006,
    message: '没有权限执行该操作',
    httpStatus: 200,
  } satisfies BizError,

  VALIDATION_ERROR: {
    code: 10007,
    message: '数据校验失败',
    httpStatus: 200,
  } satisfies BizError,

  DASHBOARD_STATS_FAILED: {
    code: 10008,
    message: '获取统计数据失败',
    httpStatus: 200,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
