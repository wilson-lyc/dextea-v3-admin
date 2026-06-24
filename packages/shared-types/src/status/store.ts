/**
 * 门店状态
 * 0=休息中  1=营业中  2=筹备中  3=门店已注销
 */

export const STORE_STATUS = {
  RESTING: { key: 'resting', label: '休息中', value: 0 },
  OPEN: { key: 'open', label: '营业中', value: 1 },
  PREPARING: { key: 'preparing', label: '筹备中', value: 2 },
  CLOSED: { key: 'closed', label: '门店已注销', value: 3 },
} as const;

export type StoreStatus = number;

export const STORE_STATUS_VALUES: readonly StoreStatus[] = [0, 1, 2, 3];

export function getStoreStatusLabel(status: StoreStatus): string {
  return Object.values(STORE_STATUS).find(e => e.value === status)!.label;
}
