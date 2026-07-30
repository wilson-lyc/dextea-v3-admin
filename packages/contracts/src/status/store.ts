export const STORE_STATUS = {
  CLOSED: { key: 'closed', label: '休息中', value: 0 },
  OPEN: { key: 'open', label: '营业中', value: 1 },
  PENDING: { key: 'pending', label: '筹备中', value: 2 },
  DEFUNCT: { key: 'defunct', label: '已注销', value: 3 },
} as const;

export type StoreStatusItem = (typeof STORE_STATUS)[keyof typeof STORE_STATUS];

export type StoreStatus = StoreStatusItem['value'];

export const STORE_STATUS_VALUES: readonly StoreStatus[] = Object.values(STORE_STATUS).map(
  (s) => s.value,
);

export const STORE_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(STORE_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

export const STORE_STATUS_TEXT_CLASSES: Record<number, string> = {
  [STORE_STATUS.CLOSED.value]: 'text-red-600 dark:text-red-400',
  [STORE_STATUS.OPEN.value]: 'text-green-600 dark:text-green-400',
  [STORE_STATUS.PENDING.value]: 'text-blue-600 dark:text-blue-400',
  [STORE_STATUS.DEFUNCT.value]: 'text-muted-foreground',
};

export const STORE_STATUS_BADGE_CLASSES: Record<number, string> = {
  [STORE_STATUS.CLOSED.value]:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30',
  [STORE_STATUS.OPEN.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
  [STORE_STATUS.PENDING.value]:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-200 dark:ring-blue-800/30',
  [STORE_STATUS.DEFUNCT.value]: 'bg-muted text-muted-foreground ring-muted',
};
