/**
 * 客制化项目状态
 * 0=下架  1=启用
 */

export const PRODUCT_CUSTOMIZATION_STATUS = {
  OFF: { key: "off", value: 0 },
  ON: { key: "on", value: 1 },
} as const

export type ProductCustomizationStatus = number

export const PRODUCT_CUSTOMIZATION_STATUS_VALUES: readonly ProductCustomizationStatus[] = [0, 1]

export const PRODUCT_CUSTOMIZATION_STATUS_LABEL: Record<number, string> = {
  [PRODUCT_CUSTOMIZATION_STATUS.OFF.value]: "下架",
  [PRODUCT_CUSTOMIZATION_STATUS.ON.value]: "启用",
}

export const PRODUCT_CUSTOMIZATION_STATUS_TEXT_CLASSES: Record<ProductCustomizationStatus, string> = {
  [PRODUCT_CUSTOMIZATION_STATUS.OFF.value]: "text-red-600 dark:text-red-400",
  [PRODUCT_CUSTOMIZATION_STATUS.ON.value]: "text-green-600 dark:text-green-400",
}

export const PRODUCT_CUSTOMIZATION_STATUS_BADGE_CLASSES: Record<
  ProductCustomizationStatus,
  string
> = {
  [PRODUCT_CUSTOMIZATION_STATUS.OFF.value]:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30",
  [PRODUCT_CUSTOMIZATION_STATUS.ON.value]:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30",
}
