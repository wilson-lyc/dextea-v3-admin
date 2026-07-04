/**
 * 员工状态
 * 0=禁用  1=激活
 */

export const EMPLOYEE_STATUS = {
  DISABLED: { key: 'disabled', value: 0 },
  ACTIVE: { key: 'active', value: 1 },
} as const;

export type EmployeeStatus = number;

export const EMPLOYEE_STATUS_VALUES: readonly EmployeeStatus[] = [0, 1];
