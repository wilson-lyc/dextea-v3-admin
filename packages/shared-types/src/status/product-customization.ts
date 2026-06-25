/**
 * 客制化项目状态
 * 0=下架  1=启用
 */

export const PRODUCT_CUSTOMIZATION_STATUS = {
  OFF: { key: 'off', label: '下架', value: 0 },
  ON: { key: 'on', label: '启用', value: 1 },
} as const;

export type ProductCustomizationStatus = number;

export const PRODUCT_CUSTOMIZATION_STATUS_VALUES: readonly ProductCustomizationStatus[] = [0, 1];

export function getProductCustomizationStatusLabel(status: ProductCustomizationStatus): string {
  return Object.values(PRODUCT_CUSTOMIZATION_STATUS).find(e => e.value === status)!.label;
}
