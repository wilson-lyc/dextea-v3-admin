import type { BizErrorCode } from '@/common/types';

/**
 * 通用错误码
 */
export const CommonErrorCode = {
    INVALID_PARAM: { code: 400, message: '参数错误' },
    NOT_FOUND: { code: 404, message: '资源不存在' },
    INTERNAL_ERROR: { code: 500, message: '系统异常，请稍后重试' },
    UNAUTHORIZED: { code: 401, message: '未登录或登录已过期' },
    FORBIDDEN: { code: 403, message: '没有操作权限' },
    ALIPAY_ERROR: { code: 100001, message: '支付宝服务异常' },
} satisfies Record<string, BizErrorCode>;
