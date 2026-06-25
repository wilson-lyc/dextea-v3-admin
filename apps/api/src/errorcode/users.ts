import type { BizError } from './index.js';

/**
 * 用户管理错误码 (1200-1299)
 */
export const userErrors = {
  MISSING_FIELDS: {
    code: 10200,
    message: '请填写所有必填字段',
    httpStatus: 200,
  } satisfies BizError,

  EMAIL_EXISTS: {
    code: 10201,
    message: '该邮箱已被使用',
    httpStatus: 200,
  } satisfies BizError,

  USER_NOT_FOUND: {
    code: 10202,
    message: '用户不存在',
    httpStatus: 200,
  } satisfies BizError,

  EMAIL_EXISTS_OTHER: {
    code: 10203,
    message: '该邮箱已被其他用户使用',
    httpStatus: 200,
  } satisfies BizError,

  LIST_FAILED: {
    code: 10204,
    message: '获取用户列表失败',
    httpStatus: 200,
  } satisfies BizError,

  CREATE_FAILED: {
    code: 10205,
    message: '创建用户失败',
    httpStatus: 200,
  } satisfies BizError,

  UPDATE_FAILED: {
    code: 10206,
    message: '更新用户失败',
    httpStatus: 200,
  } satisfies BizError,

  OPERATE_FAILED: {
    code: 10207,
    message: '操作失败',
    httpStatus: 200,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
