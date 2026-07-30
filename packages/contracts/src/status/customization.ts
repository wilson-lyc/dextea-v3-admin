export const CUSTOMIZATION_STATUS = {
  DISABLED: { key: 'disabled', label: '禁用', value: 0 },
  ACTIVE: { key: 'active', label: '激活', value: 1 },
} as const;

export type CustomizationStatusItem = (typeof CUSTOMIZATION_STATUS)[keyof typeof CUSTOMIZATION_STATUS];

export type CustomizationStatus = CustomizationStatusItem['value'];

export const CUSTOMIZATION_STATUS_VALUES: readonly CustomizationStatus[] = Object.values(
  CUSTOMIZATION_STATUS,
).map((s) => s.value);

export const CUSTOMIZATION_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(CUSTOMIZATION_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

export const CUSTOMIZATION_STATUS_TEXT_CLASSES: Record<number, string> = {
  [CUSTOMIZATION_STATUS.DISABLED.value]: 'text-destructive',
  [CUSTOMIZATION_STATUS.ACTIVE.value]: 'text-green-600 dark:text-green-400',
};

export const CUSTOMIZATION_STATUS_BADGE_CLASSES: Record<number, string> = {
  [CUSTOMIZATION_STATUS.DISABLED.value]: 'bg-muted text-muted-foreground ring-muted',
  [CUSTOMIZATION_STATUS.ACTIVE.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};
