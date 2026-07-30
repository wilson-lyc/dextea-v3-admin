export const CUSTOMIZATION_OPTION_STATUS = {
  GLOBAL_DISABLED: { key: 'global_disabled', label: '全局禁用', value: 0 },
  GLOBAL_ACTIVE: { key: 'global_active', label: '全局激活', value: 1 },
} as const;

export type CustomizationOptionStatusItem =
  (typeof CUSTOMIZATION_OPTION_STATUS)[keyof typeof CUSTOMIZATION_OPTION_STATUS];

export type CustomizationOptionStatus = CustomizationOptionStatusItem['value'];

export const CUSTOMIZATION_OPTION_STATUS_VALUES: readonly CustomizationOptionStatus[] = Object.values(
  CUSTOMIZATION_OPTION_STATUS,
).map((s) => s.value);

export const CUSTOMIZATION_OPTION_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(CUSTOMIZATION_OPTION_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

export const CUSTOMIZATION_OPTION_STATUS_TEXT_CLASSES: Record<number, string> = {
  [CUSTOMIZATION_OPTION_STATUS.GLOBAL_DISABLED.value]: 'text-destructive',
  [CUSTOMIZATION_OPTION_STATUS.GLOBAL_ACTIVE.value]: 'text-green-600 dark:text-green-400',
};

export const CUSTOMIZATION_OPTION_STATUS_BADGE_CLASSES: Record<number, string> = {
  [CUSTOMIZATION_OPTION_STATUS.GLOBAL_DISABLED.value]: 'bg-muted text-muted-foreground ring-muted',
  [CUSTOMIZATION_OPTION_STATUS.GLOBAL_ACTIVE.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};

export const CUSTOMIZATION_OPTION_STORE_STATUS = {
  STORE_DISABLED: { key: 'store_disabled', label: '门店禁用', value: 0 },
  STORE_ACTIVE: { key: 'store_active', label: '门店激活', value: 1 },
} as const;

export type CustomizationOptionStoreStatusItem =
  (typeof CUSTOMIZATION_OPTION_STORE_STATUS)[keyof typeof CUSTOMIZATION_OPTION_STORE_STATUS];

export type CustomizationOptionStoreStatus = CustomizationOptionStoreStatusItem['value'];

export const CUSTOMIZATION_OPTION_STORE_STATUS_VALUES: readonly CustomizationOptionStoreStatus[] =
  Object.values(CUSTOMIZATION_OPTION_STORE_STATUS).map((s) => s.value);

export const CUSTOMIZATION_OPTION_STORE_STATUS_LABEL: Record<number, string> =
  Object.fromEntries(
    Object.values(CUSTOMIZATION_OPTION_STORE_STATUS).map((s) => [s.value, s.label]),
  ) as Record<number, string>;

export const CUSTOMIZATION_OPTION_STORE_STATUS_ACTION: Record<number, string> = {
  [CUSTOMIZATION_OPTION_STORE_STATUS.STORE_ACTIVE.value]: '禁用',
  [CUSTOMIZATION_OPTION_STORE_STATUS.STORE_DISABLED.value]: '激活',
};

export const CUSTOMIZATION_OPTION_STORE_STATUS_TEXT_CLASSES: Record<number, string> = {
  [CUSTOMIZATION_OPTION_STORE_STATUS.STORE_DISABLED.value]: 'text-destructive',
  [CUSTOMIZATION_OPTION_STORE_STATUS.STORE_ACTIVE.value]: 'text-green-600 dark:text-green-400',
};

export const CUSTOMIZATION_OPTION_STORE_STATUS_BADGE_CLASSES: Record<number, string> = {
  [CUSTOMIZATION_OPTION_STORE_STATUS.STORE_DISABLED.value]: 'bg-muted text-muted-foreground ring-muted',
  [CUSTOMIZATION_OPTION_STORE_STATUS.STORE_ACTIVE.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};
