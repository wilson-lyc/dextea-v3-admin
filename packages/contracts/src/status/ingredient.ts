/**
 * 原料状态
 * 0=禁用  1=激活
 *
 * 状态项统一包含三个字段：
 * - key:   稳定的字符串键（用于序列化/枚举标识）
 * - label: 中文语义（用于界面展示，禁止直接展示数字）
 * - value: 数字值（数据库存储 / 接口传输）
 */
export const INGREDIENT_STATUS = {
  ACTIVE: { key: 'active', label: '禁用', value: 0 },
  DISABLED: { key: 'disabled', label: '激活', value: 1 },
} as const;

/** 状态数字值联合类型 */
export type IngredientStatus = number;

/** 所有状态值 */
export const INGREDIENT_STATUS_VALUES: readonly IngredientStatus[] = [0, 1];

/** value -> 中文 label 映射 */
export const INGREDIENT_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(INGREDIENT_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

// ──── 前端展示样式（视图层，按状态值映射到 Tailwind 类） ────

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
