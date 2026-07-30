export const ROLE_STATUS = {
  DISABLED: { key: 'disabled', label: '禁用', value: 0 },
  ACTIVE: { key: 'active', label: '启用', value: 1 },
} as const;

export type RoleStatusItem = (typeof ROLE_STATUS)[keyof typeof ROLE_STATUS];

export type RoleStatus = RoleStatusItem['value'];

export const ROLE_STATUS_VALUES: readonly RoleStatus[] = Object.values(ROLE_STATUS).map(
  (s) => s.value,
);

export const ROLE_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(ROLE_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

export const ROLE_STATUS_TEXT_CLASSES: Record<number, string> = {
  [ROLE_STATUS.DISABLED.value]: 'text-destructive',
  [ROLE_STATUS.ACTIVE.value]: 'text-green-600 dark:text-green-400',
};

export const ROLE_STATUS_BADGE_CLASSES: Record<number, string> = {
  [ROLE_STATUS.DISABLED.value]: 'bg-muted text-muted-foreground ring-muted',
  [ROLE_STATUS.ACTIVE.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};
