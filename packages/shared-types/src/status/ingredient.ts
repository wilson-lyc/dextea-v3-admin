/**
 * 原料状态
 * 0=下架  1=启用
 */

export const INGREDIENT_STATUS = {
  OFF: { key: 'off', value: 0 },
  ON: { key: 'on', value: 1 },
} as const;

export type IngredientStatus = number;

export const INGREDIENT_STATUS_VALUES: readonly IngredientStatus[] = [0, 1];
