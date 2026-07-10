/**
 * 门店状态
 * 0=休息中  1=营业中  2=筹备中  3=门店已注销
 */

export const STORE_STATUS = {
  RESTING: { key: "resting", value: 0 },
  OPEN: { key: "open", value: 1 },
  PREPARING: { key: "preparing", value: 2 },
  CLOSED: { key: "closed", value: 3 },
} as const

export type StoreStatus = number

export const STORE_STATUS_VALUES: readonly StoreStatus[] = [0, 1, 2, 3]

export const STORE_STATUS_LABEL: Record<number, string> = {
  [STORE_STATUS.RESTING.value]: "休息中",
  [STORE_STATUS.OPEN.value]: "营业中",
  [STORE_STATUS.PREPARING.value]: "筹备中",
  [STORE_STATUS.CLOSED.value]: "已注销",
}

export const STORE_STATUS_TEXT_CLASSES: Record<StoreStatus, string> = {
  [STORE_STATUS.RESTING.value]: "text-red-600 dark:text-red-400",
  [STORE_STATUS.OPEN.value]: "text-green-600 dark:text-green-400",
  [STORE_STATUS.PREPARING.value]: "text-blue-600 dark:text-blue-400",
  [STORE_STATUS.CLOSED.value]: "text-muted-foreground",
}

export const STORE_STATUS_BADGE_CLASSES: Record<StoreStatus, string> = {
  [STORE_STATUS.RESTING.value]:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30",
  [STORE_STATUS.OPEN.value]:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30",
  [STORE_STATUS.PREPARING.value]:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-200 dark:ring-blue-800/30",
  [STORE_STATUS.CLOSED.value]: "bg-muted text-muted-foreground ring-muted",
}
