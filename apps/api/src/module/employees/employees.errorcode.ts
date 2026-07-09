import type { BizErrorCode } from '@/common/types';

/**
 * 员工管理错误码 (10200-10299)
 */
export const EmployeeErrorCodes = {
  MISSING_FIELDS: { code: 10200, message: '请填写所有必填字段' },
  EMAIL_EXISTS: { code: 10201, message: '该邮箱已被使用' },
  EMPLOYEE_NOT_FOUND: { code: 10202, message: '员工不存在' },
  EMAIL_EXISTS_OTHER: { code: 10203, message: '该邮箱已被其他员工使用' },
  LIST_FAILED: { code: 10204, message: '获取员工列表失败' },
  CREATE_FAILED: { code: 10205, message: '创建员工失败' },
  UPDATE_FAILED: { code: 10206, message: '更新员工失败' },
  OPERATE_FAILED: { code: 10207, message: '操作失败' },
} as const satisfies Record<string, BizErrorCode>;
