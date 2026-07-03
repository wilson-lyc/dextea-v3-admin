import type { UserStatus } from "@dextea/shared-types"
import { USER_STATUS } from "@dextea/shared-types"

export const USER_STATUS_LABEL: Record<number, string> = {
  [USER_STATUS.DISABLED.value]: "禁用",
  [USER_STATUS.ACTIVE.value]: "激活",
}

export const USER_STATUS_TEXT_CLASSES: Record<UserStatus, string> = {
  [USER_STATUS.DISABLED.value]: "text-muted-foreground",
  [USER_STATUS.ACTIVE.value]: "text-green-600 dark:text-green-400",
}

export const USER_STATUS_BADGE_CLASSES: Record<UserStatus, string> = {
  [USER_STATUS.DISABLED.value]: "bg-muted text-muted-foreground ring-muted",
  [USER_STATUS.ACTIVE.value]: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30",
}
