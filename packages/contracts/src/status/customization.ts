/**
 * 客制化项目状态
 * 0=下架  1=启用
 *
 * 状态项统一包含三个字段：
 * - key:   稳定的字符串键（用于序列化/枚举标识）
 * - label: 中文语义（用于界面展示，禁止直接展示数字）
 * - value: 数字值（数据库存储 / 接口传输）
 */
export const CUSTOMIZATION_STATUS = {
  OFF: { key: 'off', label: '下架', value: 0 },
  ON: { key: 'on', label: '启用', value: 1 },
} as const;

/** 状态数字值联合类型 */
export type CustomizationStatus = number;

/** 所有状态值 */
export const CUSTOMIZATION_STATUS_VALUES: readonly CustomizationStatus[] = [0, 1];

/** value -> 中文 label 映射 */
export const CUSTOMIZATION_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(CUSTOMIZATION_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

// ──── 前端展示样式（视图层，按状态值映射到 Tailwind 类） ────

export const CUSTOMIZATION_STATUS_TEXT_CLASSES: Record<number, string> = {
  [CUSTOMIZATION_STATUS.OFF.value]: 'text-red-600 dark:text-red-400',
  [CUSTOMIZATION_STATUS.ON.value]: 'text-green-600 dark:text-green-400',
};

export const CUSTOMIZATION_STATUS_BADGE_CLASSES: Record<number, string> = {
  [CUSTOMIZATION_STATUS.OFF.value]:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30',
  [CUSTOMIZATION_STATUS.ON.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};
