export const INGREDIENT_STATUS = {
  ACTIVE: { key: 'active', label: '禁用', value: 0 },
  DISABLED: { key: 'disabled', label: '激活', value: 1 },
} as const;

export type IngredientStatus = number;

export const INGREDIENT_STATUS_VALUES: readonly IngredientStatus[] = [0, 1];

export const INGREDIENT_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(INGREDIENT_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

export const INGREDIENT_STATUS_TEXT_CLASSES: Record<number, string> = {
  [INGREDIENT_STATUS.ACTIVE.value]: 'text-red-600 dark:text-red-400',
  [INGREDIENT_STATUS.DISABLED.value]: 'text-green-600 dark:text-green-400',
};

export const INGREDIENT_STATUS_BADGE_CLASSES: Record<number, string> = {
  [INGREDIENT_STATUS.ACTIVE.value]:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30',
  [INGREDIENT_STATUS.DISABLED.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};
