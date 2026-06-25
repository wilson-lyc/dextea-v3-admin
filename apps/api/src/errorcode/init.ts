import type { BizError } from './index.js';

/**
 * 系统初始化错误码 (1500-1599)
 */
export const initErrors = {
  ALREADY_INITIALIZED: {
    code: 10500,
    message: '系统已初始化，请勿重复操作',
    httpStatus: 200,
  } satisfies BizError,

  INIT_FAILED: {
    code: 10501,
    message: '初始化失败，请检查数据库连接或稍后重试',
    httpStatus: 200,
  } satisfies BizError,

  MISSING_FIELDS: {
    code: 10502,
    message: '请填写所有必填字段',
    httpStatus: 200,
  } satisfies BizError,

  EMAIL_EXISTS: {
    code: 10503,
    message: '该邮箱已被使用',
    httpStatus: 200,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
