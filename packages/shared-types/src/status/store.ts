// ====== 门店状态 ======
// 0=休息中  1=营业中  2=筹备中  3=门店已注销
// ──────────────────────────────

export type StoreStatus = 0 | 1 | 2 | 3;

export const STORE_STATUS = {
  RESTING: 0,
  OPEN: 1,
  PREPARING: 2,
  CLOSED: 3,
} as const;

export const STORE_STATUS_LABEL: Record<StoreStatus, string> = {
  [STORE_STATUS.RESTING]: '休息中',
  [STORE_STATUS.OPEN]: '营业中',
  [STORE_STATUS.PREPARING]: '筹备中',
  [STORE_STATUS.CLOSED]: '门店已注销',
} as const;

/** 门店状态值列表（用于 API 校验） */
export const STORE_STATUS_VALUES: readonly StoreStatus[] = [0, 1, 2, 3];

export function getStoreStatusLabel(status: StoreStatus): string {
  return STORE_STATUS_LABEL[status];
}
