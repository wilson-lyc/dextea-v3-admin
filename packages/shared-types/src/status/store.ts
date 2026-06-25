/**
 * 门店状态
 * 0=休息中  1=营业中  2=筹备中  3=门店已注销
 */

export const STORE_STATUS = {
  RESTING: { key: 'resting', value: 0 },
  OPEN: { key: 'open', value: 1 },
  PREPARING: { key: 'preparing', value: 2 },
  CLOSED: { key: 'closed', value: 3 },
} as const;

export type StoreStatus = number;

export const STORE_STATUS_VALUES: readonly StoreStatus[] = [0, 1, 2, 3];
