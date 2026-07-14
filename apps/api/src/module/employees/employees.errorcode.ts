import type { BizErrorCode } from '@/common/types';

/**
 * 员工管理错误码 (10200-10299)
 */
export const EmployeeErrorCodes = {
  EMAIL_EXISTS: { code: 10201, message: '该邮箱已被使用' },
  EMPLOYEE_NOT_FOUND: { code: 10202, message: '员工不存在' },
  EMAIL_EXISTS_OTHER: { code: 10203, message: '该邮箱已被其他员工使用' },
  INVALID_STATUS: { code: 10204, message: '员工状态值不合法' },
  ROLE_NOT_FOUND: { code: 10205, message: '存在无效的角色，请刷新后重试' },
  SET_ROLES_FAILED: { code: 10206, message: '设置员工角色失败' },
} as const satisfies Record<string, BizErrorCode>;
