import type { BizError } from './index.js';

/**
 * 认证业务错误码 (1100-1199)
 */
export const authErrors = {
  INVALID_CREDENTIALS: {
    code: 10100,
    message: '账号或密码错误',
    httpStatus: 200,
  } satisfies BizError,

  ACCOUNT_DISABLED: {
    code: 10101,
    message: '该账号已被禁用',
    httpStatus: 200,
  } satisfies BizError,

  MISSING_CREDENTIALS: {
    code: 10102,
    message: '请输入账号和密码',
    httpStatus: 200,
  } satisfies BizError,

  INVALID_TOKEN: {
    code: 10103,
    message: '未提供有效的认证令牌',
    httpStatus: 401,
  } satisfies BizError,

  LOGIN_FAILED: {
    code: 10104,
    message: '登录失败，请稍后重试',
    httpStatus: 200,
  } satisfies BizError,

  LOGOUT_FAILED: {
    code: 10105,
    message: '退出登录失败',
    httpStatus: 200,
  } satisfies BizError,

  TOKEN_EXPIRED: {
    code: 10106,
    message: '认证令牌已过期，请重新登录',
    httpStatus: 401,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
