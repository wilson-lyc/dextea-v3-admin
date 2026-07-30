import { defineStatus } from './factory.js'

const _employee = defineStatus(
  {
    DISABLED: { key: 'disabled', label: '禁用', value: 0 },
    ACTIVE: { key: 'active', label: '激活', value: 1 },
  } as const,
  { 0: 'destructive', 1: 'green' },
)

export const EMPLOYEE_STATUS = _employee.items
export type EmployeeStatusItem = typeof _employee.Item
export type EmployeeStatus = typeof _employee.Value
export const EMPLOYEE_STATUS_VALUES = _employee.values
export const EMPLOYEE_STATUS_LABEL = _employee.label
export const EMPLOYEE_STATUS_TEXT_CLASSES = _employee.textClasses
export const EMPLOYEE_STATUS_BADGE_CLASSES = _employee.badgeClasses
