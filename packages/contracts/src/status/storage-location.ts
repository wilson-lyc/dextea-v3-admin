/**
 * 存储位置启用状态
 * 0=禁用  1=启用
 *
 * 状态项统一包含三个字段：
 * - key:   稳定的字符串键（用于序列化/枚举标识）
 * - label: 中文语义（用于界面展示，禁止直接展示数字）
 * - value: 数字值（数据库存储 / 接口传输）
 */
export const STORAGE_LOCATION_STATUS = {
  DISABLED: { key: 'disabled', label: '禁用', value: 0 },
  ENABLED: { key: 'enabled', label: '启用', value: 1 },
} as const;

/** 单个状态项类型 */
export type StorageLocationStatusItem = (typeof STORAGE_LOCATION_STATUS)[keyof typeof STORAGE_LOCATION_STATUS];

/** 状态数字值类型（响应 DTO 中 status 为 z.number()，此处以 number 兼容） */
export type StorageLocationStatus = number;

/** 所有状态值 */
export const STORAGE_LOCATION_STATUS_VALUES: readonly StorageLocationStatus[] = Object.values(
  STORAGE_LOCATION_STATUS,
).map((s) => s.value);

/** value -> 中文 label 映射 */
export const STORAGE_LOCATION_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(STORAGE_LOCATION_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

// ──── 前端展示样式（视图层，按状态值映射到 Tailwind 类） ────

export const STORAGE_LOCATION_STATUS_TEXT_CLASSES: Record<number, string> = {
  [STORAGE_LOCATION_STATUS.DISABLED.value]: 'text-red-600 dark:text-red-400',
  [STORAGE_LOCATION_STATUS.ENABLED.value]: 'text-green-600 dark:text-green-400',
};

export const STORAGE_LOCATION_STATUS_BADGE_CLASSES: Record<number, string> = {
  [STORAGE_LOCATION_STATUS.DISABLED.value]:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30',
  [STORAGE_LOCATION_STATUS.ENABLED.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};
