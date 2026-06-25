/**
 * 用户状态
 * 0=禁用  1=激活
 */

export const USER_STATUS = {
  DISABLED: { key: 'disabled', value: 0 },
  ACTIVE: { key: 'active', value: 1 },
} as const;

export type UserStatus = number;

export const USER_STATUS_VALUES: readonly UserStatus[] = [0, 1];
