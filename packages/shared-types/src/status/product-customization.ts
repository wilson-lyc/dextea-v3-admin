/**
 * 客制化项目状态
 * 0=下架  1=启用
 */

export const PRODUCT_CUSTOMIZATION_STATUS = {
  OFF: { key: 'off', value: 0 },
  ON: { key: 'on', value: 1 },
} as const;

export type ProductCustomizationStatus = number;

export const PRODUCT_CUSTOMIZATION_STATUS_VALUES: readonly ProductCustomizationStatus[] = [0, 1];
