export const CUSTOMER_STATUS = {
  ACTIVE: { key: 'active', label: '禁用', value: 0 },
  DISABLED: { key: 'disabled', label: '激活', value: 1 },
} as const;

export type CustomerStatusItem = (typeof CUSTOMER_STATUS)[keyof typeof CUSTOMER_STATUS];

export type CustomerStatus = CustomerStatusItem['value'];

export const CUSTOMER_STATUS_VALUES: readonly CustomerStatus[] = Object.values(
  CUSTOMER_STATUS,
).map((s) => s.value);

export const CUSTOMER_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(CUSTOMER_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

export const CUSTOMER_STATUS_TEXT_CLASSES: Record<number, string> = {
  [CUSTOMER_STATUS.ACTIVE.value]: 'text-destructive',
  [CUSTOMER_STATUS.DISABLED.value]: 'text-green-600 dark:text-green-400',
};

export const CUSTOMER_STATUS_BADGE_CLASSES: Record<number, string> = {
  [CUSTOMER_STATUS.ACTIVE.value]: 'bg-muted text-muted-foreground ring-muted',
  [CUSTOMER_STATUS.DISABLED.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};
