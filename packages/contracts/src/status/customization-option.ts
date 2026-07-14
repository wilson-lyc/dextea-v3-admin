/**
 * 客制化选项状态
 * 0=禁用  1=激活
 *
 * 状态项统一包含三个字段：
 * - key:   稳定的字符串键（用于序列化/枚举标识）
 * - label: 中文语义（用于界面展示，禁止直接展示数字）
 * - value: 数字值（数据库存储 / 接口传输）
 */
export const CUSTOMIZATION_OPTION_STATUS = {
  DISABLED: { key: 'disabled', label: '禁用', value: 0 },
  ACTIVE: { key: 'active', label: '激活', value: 1 },
} as const;

/** 单个状态项类型 */
export type CustomizationOptionStatusItem =
  (typeof CUSTOMIZATION_OPTION_STATUS)[keyof typeof CUSTOMIZATION_OPTION_STATUS];

/** 状态数字值联合类型 */
export type CustomizationOptionStatus = CustomizationOptionStatusItem['value'];

/** 所有状态值 */
export const CUSTOMIZATION_OPTION_STATUS_VALUES: readonly CustomizationOptionStatus[] = Object.values(
  CUSTOMIZATION_OPTION_STATUS,
).map((s) => s.value);

/** value -> 中文 label 映射 */
export const CUSTOMIZATION_OPTION_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(CUSTOMIZATION_OPTION_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

// ──── 前端展示样式（视图层，按状态值映射到 Tailwind 类） ────

export const CUSTOMIZATION_OPTION_STATUS_TEXT_CLASSES: Record<number, string> = {
  [CUSTOMIZATION_OPTION_STATUS.DISABLED.value]: 'text-destructive',
  [CUSTOMIZATION_OPTION_STATUS.ACTIVE.value]: 'text-green-600 dark:text-green-400',
};

export const CUSTOMIZATION_OPTION_STATUS_BADGE_CLASSES: Record<number, string> = {
  [CUSTOMIZATION_OPTION_STATUS.DISABLED.value]: 'bg-muted text-muted-foreground ring-muted',
  [CUSTOMIZATION_OPTION_STATUS.ACTIVE.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};

/**
 * 客制化选项门店状态
 * 0=禁用（该选项在当前门店不可用）  1=启用（该选项在当前门店可用）
 *
 * 与全局选项状态（CUSTOMIZATION_OPTION_STATUS）区分：本枚举描述的是
 * 「某选项在某个门店」的覆盖状态，由门店目录的 upsert 懒加载维护。
 */
export const CUSTOMIZATION_OPTION_STORE_STATUS = {
  DISABLED: { key: 'disabled', label: '禁用', value: 0 },
  ENABLED: { key: 'enabled', label: '启用', value: 1 },
} as const;

/** 单个状态项类型 */
export type CustomizationOptionStoreStatusItem =
  (typeof CUSTOMIZATION_OPTION_STORE_STATUS)[keyof typeof CUSTOMIZATION_OPTION_STORE_STATUS];

/** 状态数字值联合类型 */
export type CustomizationOptionStoreStatus = CustomizationOptionStoreStatusItem['value'];

/** 所有状态值 */
export const CUSTOMIZATION_OPTION_STORE_STATUS_VALUES: readonly CustomizationOptionStoreStatus[] =
  Object.values(CUSTOMIZATION_OPTION_STORE_STATUS).map((s) => s.value);

/** value -> 中文 label 映射 */
export const CUSTOMIZATION_OPTION_STORE_STATUS_LABEL: Record<number, string> =
  Object.fromEntries(
    Object.values(CUSTOMIZATION_OPTION_STORE_STATUS).map((s) => [s.value, s.label]),
  ) as Record<number, string>;

/** 操作按钮文案映射（当前状态 -> 将要执行的动作） */
export const CUSTOMIZATION_OPTION_STORE_STATUS_ACTION: Record<number, string> = {
  [CUSTOMIZATION_OPTION_STORE_STATUS.ENABLED.value]: '禁用',
  [CUSTOMIZATION_OPTION_STORE_STATUS.DISABLED.value]: '激活',
};

// ──── 前端展示样式（视图层，按状态值映射到 Tailwind 类） ────

export const CUSTOMIZATION_OPTION_STORE_STATUS_TEXT_CLASSES: Record<number, string> = {
  [CUSTOMIZATION_OPTION_STORE_STATUS.DISABLED.value]: 'text-destructive',
  [CUSTOMIZATION_OPTION_STORE_STATUS.ENABLED.value]: 'text-green-600 dark:text-green-400',
};
