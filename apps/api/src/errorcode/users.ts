import type { BizError } from './index.js';

/**
 * 用户管理错误码 (1200-1299)
 */
export const userErrors = {
  MISSING_FIELDS: {
    code: 1200,
    message: '请填写所有必填字段',
    httpStatus: 400,
  } satisfies BizError,

  EMAIL_EXISTS: {
    code: 1201,
    message: '该邮箱已被使用',
    httpStatus: 400,
  } satisfies BizError,

  USER_NOT_FOUND: {
    code: 1202,
    message: '用户不存在',
    httpStatus: 404,
  } satisfies BizError,

  EMAIL_EXISTS_OTHER: {
    code: 1203,
    message: '该邮箱已被其他用户使用',
    httpStatus: 400,
  } satisfies BizError,

  LIST_FAILED: {
    code: 1204,
    message: '获取用户列表失败',
    httpStatus: 500,
  } satisfies BizError,

  CREATE_FAILED: {
    code: 1205,
    message: '创建用户失败',
    httpStatus: 500,
  } satisfies BizError,

  UPDATE_FAILED: {
    code: 1206,
    message: '更新用户失败',
    httpStatus: 500,
  } satisfies BizError,

  OPERATE_FAILED: {
    code: 1207,
    message: '操作失败',
    httpStatus: 500,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
