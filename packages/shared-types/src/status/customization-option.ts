/**
 * 客制化选项状态
 * 0=下架  1=启用
 */

export const CUSTOMIZATION_OPTION_STATUS = {
  OFF: { key: 'off', label: '下架', value: 0 },
  ON: { key: 'on', label: '启用', value: 1 },
} as const;

export type CustomizationOptionStatus = number;

export const CUSTOMIZATION_OPTION_STATUS_VALUES: readonly CustomizationOptionStatus[] = [0, 1];

export function getCustomizationOptionStatusLabel(status: CustomizationOptionStatus): string {
  return Object.values(CUSTOMIZATION_OPTION_STATUS).find(e => e.value === status)!.label;
}
