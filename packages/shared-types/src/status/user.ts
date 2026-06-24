/**
 * 用户状态
 * 0=禁用  1=激活
 */

export const USER_STATUS = {
  DISABLED: { key: 'disabled', label: '禁用', value: 0 },
  ACTIVE: { key: 'active', label: '激活', value: 1 },
} as const;

export type UserStatus = number;

export const USER_STATUS_VALUES: readonly UserStatus[] = [0, 1];

export function getUserStatusLabel(status: UserStatus): string {
  return Object.values(USER_STATUS).find(e => e.value === status)!.label;
}
