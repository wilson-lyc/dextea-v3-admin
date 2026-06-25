/**
 * 商品状态
 * 0=下架  1=可售
 */

export const PRODUCT_STATUS = {
  OFF: { key: 'off', value: 0 },
  ON: { key: 'on', value: 1 },
} as const;

export type ProductStatus = number;

export const PRODUCT_STATUS_VALUES: readonly ProductStatus[] = [0, 1];
