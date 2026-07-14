/**
 * 角色状态
 * 0=禁用  1=启用
 *
 * 状态项统一包含三个字段：
 * - key:   稳定的字符串键（用于序列化/枚举标识）
 * - label: 中文语义（用于界面展示，禁止直接展示数字）
 * - value: 数字值（数据库存储 / 接口传输）
 */
export const ROLE_STATUS = {
  DISABLED: { key: 'disabled', label: '禁用', value: 0 },
  ACTIVE: { key: 'active', label: '启用', value: 1 },
} as const;

/** 单个状态项类型 */
export type RoleStatusItem = (typeof ROLE_STATUS)[keyof typeof ROLE_STATUS];

/** 状态数字值联合类型 */
export type RoleStatus = RoleStatusItem['value'];

/** 所有状态值 */
export const ROLE_STATUS_VALUES: readonly RoleStatus[] = Object.values(ROLE_STATUS).map(
  (s) => s.value,
);

/** value -> 中文 label 映射 */
export const ROLE_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(ROLE_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

// ──── 前端展示样式（视图层，按状态值映射到 Tailwind 类） ────

export const ROLE_STATUS_TEXT_CLASSES: Record<number, string> = {
  [ROLE_STATUS.DISABLED.value]: 'text-destructive',
  [ROLE_STATUS.ACTIVE.value]: 'text-green-600 dark:text-green-400',
};

export const ROLE_STATUS_BADGE_CLASSES: Record<number, string> = {
  [ROLE_STATUS.DISABLED.value]: 'bg-muted text-muted-foreground ring-muted',
  [ROLE_STATUS.ACTIVE.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};
