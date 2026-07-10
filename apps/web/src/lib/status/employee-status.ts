import {
  EMPLOYEE_STATUS,
  EMPLOYEE_STATUS_VALUES,
  EMPLOYEE_STATUS_LABEL,
  type EmployeeStatus,
} from "@dextea-admin/contracts/status"

// 状态枚举的 key/label/value 统一来自 @dextea-admin/contracts，
// 这里的 TEXT/BADGE 样式属于前端视图层，保留在本地。
export { EMPLOYEE_STATUS, EMPLOYEE_STATUS_VALUES, EMPLOYEE_STATUS_LABEL }
export type { EmployeeStatus }

export const EMPLOYEE_STATUS_TEXT_CLASSES: Record<number, string> = {
  [EMPLOYEE_STATUS.DISABLED.value]: "text-destructive",
  [EMPLOYEE_STATUS.ACTIVE.value]: "text-green-600 dark:text-green-400",
}

export const EMPLOYEE_STATUS_BADGE_CLASSES: Record<number, string> = {
  [EMPLOYEE_STATUS.DISABLED.value]: "bg-muted text-muted-foreground ring-muted",
  [EMPLOYEE_STATUS.ACTIVE.value]:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30",
}
