import type { BizError } from './index.js';

/**
 * 员工管理错误码 (1200-1299)
 */
export const employeeErrors = {
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

  EMPLOYEE_NOT_FOUND: {
    code: 10202,
    message: '员工不存在',
    httpStatus: 200,
  } satisfies BizError,

  EMAIL_EXISTS_OTHER: {
    code: 10203,
    message: '该邮箱已被其他员工使用',
    httpStatus: 200,
  } satisfies BizError,

  LIST_FAILED: {
    code: 10204,
    message: '获取员工列表失败',
    httpStatus: 200,
  } satisfies BizError,

  CREATE_FAILED: {
    code: 10205,
    message: '创建员工失败',
    httpStatus: 200,
  } satisfies BizError,

  UPDATE_FAILED: {
    code: 10206,
    message: '更新员工失败',
    httpStatus: 200,
  } satisfies BizError,

  OPERATE_FAILED: {
    code: 10207,
    message: '操作失败',
    httpStatus: 200,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
