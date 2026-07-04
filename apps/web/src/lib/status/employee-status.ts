import type { EmployeeStatus } from "@dextea/shared-types"
import { EMPLOYEE_STATUS } from "@dextea/shared-types"

export const EMPLOYEE_STATUS_LABEL: Record<number, string> = {
  [EMPLOYEE_STATUS.DISABLED.value]: "禁用",
  [EMPLOYEE_STATUS.ACTIVE.value]: "激活",
}

export const EMPLOYEE_STATUS_TEXT_CLASSES: Record<EmployeeStatus, string> = {
  [EMPLOYEE_STATUS.DISABLED.value]: "text-destructive",
  [EMPLOYEE_STATUS.ACTIVE.value]: "text-green-600 dark:text-green-400",
}

export const EMPLOYEE_STATUS_BADGE_CLASSES: Record<EmployeeStatus, string> = {
  [EMPLOYEE_STATUS.DISABLED.value]: "bg-muted text-muted-foreground ring-muted",
  [EMPLOYEE_STATUS.ACTIVE.value]: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30",
}
