import type { CustomizationOptionStatus } from "@dextea/shared-types"
import { CUSTOMIZATION_OPTION_STATUS } from "@dextea/shared-types"

export const CUSTOMIZATION_OPTION_STATUS_LABEL: Record<number, string> = {
  [CUSTOMIZATION_OPTION_STATUS.OFF.value]: "下架",
  [CUSTOMIZATION_OPTION_STATUS.ON.value]: "启用",
}

export const CUSTOMIZATION_OPTION_STATUS_TEXT_CLASSES: Record<CustomizationOptionStatus, string> = {
  [CUSTOMIZATION_OPTION_STATUS.OFF.value]: "text-red-600 dark:text-red-400",
  [CUSTOMIZATION_OPTION_STATUS.ON.value]: "text-green-600 dark:text-green-400",
}

export const CUSTOMIZATION_OPTION_STATUS_BADGE_CLASSES: Record<CustomizationOptionStatus, string> = {
  [CUSTOMIZATION_OPTION_STATUS.OFF.value]: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30",
  [CUSTOMIZATION_OPTION_STATUS.ON.value]: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30",
}
