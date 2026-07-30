import { defineStatus } from './factory.js'

const _ingredient = defineStatus(
  {
    ACTIVE: { key: 'active', label: '禁用', value: 0 },
    DISABLED: { key: 'disabled', label: '激活', value: 1 },
  } as const,
  { 0: 'red', 1: 'green' },
)

export const INGREDIENT_STATUS = _ingredient.items
export type IngredientStatus = number
export const INGREDIENT_STATUS_VALUES = _ingredient.values
export const INGREDIENT_STATUS_LABEL = _ingredient.label
export const INGREDIENT_STATUS_TEXT_CLASSES = _ingredient.textClasses
export const INGREDIENT_STATUS_BADGE_CLASSES = _ingredient.badgeClasses
