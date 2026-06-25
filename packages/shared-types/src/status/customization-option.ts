/**
 * 客制化选项状态
 * 0=下架  1=启用
 */

export const CUSTOMIZATION_OPTION_STATUS = {
  OFF: { key: 'off', value: 0 },
  ON: { key: 'on', value: 1 },
} as const;

export type CustomizationOptionStatus = number;

export const CUSTOMIZATION_OPTION_STATUS_VALUES: readonly CustomizationOptionStatus[] = [0, 1];
