import type { BizErrorCode } from '@/common/types';

/**
 * 认证业务错误码 (10100-10199)
 */
export const AuthErrorCodes = {
  INVALID_CREDENTIALS: { code: 10100, message: '账号或密码错误' },
  ACCOUNT_DISABLED: { code: 10101, message: '该账号已被禁用' },
  MISSING_CREDENTIALS: { code: 10102, message: '请输入账号和密码' },
  INVALID_TOKEN: { code: 10103, message: '未提供有效的认证令牌' },
  LOGIN_FAILED: { code: 10104, message: '登录失败，请稍后重试' },
  LOGOUT_FAILED: { code: 10105, message: '退出登录失败' },
  TOKEN_EXPIRED: { code: 10106, message: '认证令牌已过期，请重新登录' },
  OLD_PASSWORD_WRONG: { code: 10107, message: '原密码错误' },
} as const satisfies Record<string, BizErrorCode>;
