/**
 * 商品状态
 * 0=下架  1=可售
 */

export const PRODUCT_STATUS = {
  OFF: { key: "off", value: 0 },
  ON: { key: "on", value: 1 },
} as const

export type ProductStatus = number

export const PRODUCT_STATUS_VALUES: readonly ProductStatus[] = [0, 1]

export const PRODUCT_STATUS_LABEL: Record<number, string> = {
  [PRODUCT_STATUS.OFF.value]: "下架",
  [PRODUCT_STATUS.ON.value]: "可售",
}

export const PRODUCT_STATUS_TEXT_CLASSES: Record<ProductStatus, string> = {
  [PRODUCT_STATUS.OFF.value]: "text-red-600 dark:text-red-400",
  [PRODUCT_STATUS.ON.value]: "text-green-600 dark:text-green-400",
}

export const PRODUCT_STATUS_BADGE_CLASSES: Record<ProductStatus, string> = {
  [PRODUCT_STATUS.OFF.value]:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30",
  [PRODUCT_STATUS.ON.value]:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30",
}

/** 门店商品层面的状态（售罄/可售），不同于全局商品状态 */
export const STORE_PRODUCT_STATUS_LABEL: Record<number, string> = {
  0: "售罄",
  1: "可售",
}

export const STORE_PRODUCT_STATUS_TEXT_CLASSES: Record<number, string> = {
  0: "text-red-600 dark:text-red-400",
  1: "text-green-600 dark:text-green-400",
}

/** 根据全局状态和门店状态计算最终状态 */
export function getProductFinalStatus(globalStatus: number, storeStatus: number) {
  if (globalStatus === PRODUCT_STATUS.OFF.value) {
    return { label: "下架", className: PRODUCT_STATUS_TEXT_CLASSES[PRODUCT_STATUS.OFF.value] }
  }
  if (storeStatus === 0) {
    return { label: "售罄", className: STORE_PRODUCT_STATUS_TEXT_CLASSES[0] }
  }
  return { label: "可售", className: PRODUCT_STATUS_TEXT_CLASSES[PRODUCT_STATUS.ON.value] }
}
