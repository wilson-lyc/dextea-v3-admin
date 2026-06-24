// ====== 用户状态 ======
// 0=禁用  1=激活
// ──────────────────────────────

export type UserStatus = 0 | 1;

export const USER_STATUS = {
  DISABLED: 0,
  ACTIVE: 1,
} as const;

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  [USER_STATUS.DISABLED]: '禁用',
  [USER_STATUS.ACTIVE]: '激活',
} as const;

export function getUserStatusLabel(status: UserStatus): string {
  return USER_STATUS_LABEL[status];
}
