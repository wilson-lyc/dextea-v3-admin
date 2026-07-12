import type { BizErrorCode } from '@/common/types';

/**
 * 系统级通用错误码
 * - 业务码：10000-10099
 * - HTTP 通用码：400/401/403/404/500/100001
 */
export const SystemErrorCodes = {
    // 业务码 (10000-10099)
    INTERNAL_ERROR: { code: 10000, message: '服务器内部错误，请稍后重试' },
    UNKNOWN_ERROR: { code: 10001, message: '未知错误' },
    DATABASE_ERROR: { code: 10002, message: '数据库操作失败，请稍后重试' },
    REDIS_ERROR: { code: 10003, message: '缓存服务异常' },
    INVALID_REQUEST: { code: 10004, message: '请求参数无效' },
    NOT_FOUND: { code: 10005, message: '请求的资源不存在' },
    FORBIDDEN: { code: 10006, message: '没有权限执行该操作' },
    VALIDATION_ERROR: { code: 10007, message: '数据校验失败' },
    DASHBOARD_STATS_FAILED: { code: 10008, message: '获取统计数据失败' },
    LOCK_CONFLICT: { code: 10009, message: '资源正被其他操作占用，请稍后重试' },
    LOCK_ACQUIRE_FAILED: { code: 10010, message: '获取分布式锁失败，请稍后重试' },
    // HTTP 通用码
    HTTP_INVALID_PARAM: { code: 400, message: '参数错误' },
    HTTP_NOT_FOUND: { code: 404, message: '资源不存在' },
    HTTP_INTERNAL_ERROR: { code: 500, message: '系统异常，请稍后重试' },
    HTTP_UNAUTHORIZED: { code: 401, message: '未登录或登录已过期' },
    HTTP_FORBIDDEN: { code: 403, message: '没有操作权限' },
    ALIPAY_ERROR: { code: 100001, message: '支付宝服务异常' },
} as const satisfies Record<string, BizErrorCode>;
