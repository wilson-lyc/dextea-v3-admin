import type { BizErrorCode } from '@/common/types';

/**
 * 系统级通用错误码 (1000-1099)
 */
export const SystemErrorCodes = {
  INTERNAL_ERROR: { code: 10000, message: '服务器内部错误，请稍后重试' },
  UNKNOWN_ERROR: { code: 10001, message: '未知错误' },
  DATABASE_ERROR: { code: 10002, message: '数据库操作失败，请稍后重试' },
  REDIS_ERROR: { code: 10003, message: '缓存服务异常' },
  INVALID_REQUEST: { code: 10004, message: '请求参数无效' },
  NOT_FOUND: { code: 10005, message: '请求的资源不存在' },
  FORBIDDEN: { code: 10006, message: '没有权限执行该操作' },
  VALIDATION_ERROR: { code: 10007, message: '数据校验失败' },
  DASHBOARD_STATS_FAILED: { code: 10008, message: '获取统计数据失败' },
} as const satisfies Record<string, BizErrorCode>;
