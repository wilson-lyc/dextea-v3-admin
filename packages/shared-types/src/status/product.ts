/**
 * 商品状态
 * 0=下架  1=可售
 */

export const PRODUCT_STATUS = {
  OFF: { key: 'off', label: '下架', value: 0 },
  ON: { key: 'on', label: '可售', value: 1 },
} as const;

export type ProductStatus = number;

export const PRODUCT_STATUS_VALUES: readonly ProductStatus[] = [0, 1];

export function getProductStatusLabel(status: ProductStatus): string {
  return Object.values(PRODUCT_STATUS).find(e => e.value === status)!.label;
}
