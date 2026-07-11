/**
 * 商品状态
 * 0=下架  1=可售
 *
 * 状态项统一包含三个字段：
 * - key:   稳定的字符串键（用于序列化/枚举标识）
 * - label: 中文语义（用于界面展示，禁止直接展示数字）
 * - value: 数字值（数据库存储 / 接口传输）
 */
export const PRODUCT_STATUS = {
  OFF: { key: 'off', label: '下架', value: 0 },
  ON: { key: 'on', label: '可售', value: 1 },
} as const;

/** 状态数字值联合类型 */
export type ProductStatus = number;

/** 所有状态值 */
export const PRODUCT_STATUS_VALUES: readonly ProductStatus[] = [0, 1];

/** value -> 中文 label 映射 */
export const PRODUCT_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(PRODUCT_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

// ──── 前端展示样式（视图层，按状态值映射到 Tailwind 类） ────

export const PRODUCT_STATUS_TEXT_CLASSES: Record<number, string> = {
  [PRODUCT_STATUS.OFF.value]: 'text-red-600 dark:text-red-400',
  [PRODUCT_STATUS.ON.value]: 'text-green-600 dark:text-green-400',
};

export const PRODUCT_STATUS_BADGE_CLASSES: Record<number, string> = {
  [PRODUCT_STATUS.OFF.value]:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30',
  [PRODUCT_STATUS.ON.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};

/** 门店商品层面的状态（售罄/可售），不同于全局商品状态 */
export const STORE_PRODUCT_STATUS_LABEL: Record<number, string> = {
  0: '售罄',
  1: '可售',
};

export const STORE_PRODUCT_STATUS_TEXT_CLASSES: Record<number, string> = {
  0: 'text-red-600 dark:text-red-400',
  1: 'text-green-600 dark:text-green-400',
};

/** 根据全局状态和门店状态计算最终展示状态 */
export function getProductFinalStatus(globalStatus: number, storeStatus: number) {
  if (globalStatus === PRODUCT_STATUS.OFF.value) {
    return { label: '下架', className: PRODUCT_STATUS_TEXT_CLASSES[PRODUCT_STATUS.OFF.value] };
  }
  if (storeStatus === 0) {
    return { label: '售罄', className: STORE_PRODUCT_STATUS_TEXT_CLASSES[0] };
  }
  return { label: '可售', className: PRODUCT_STATUS_TEXT_CLASSES[PRODUCT_STATUS.ON.value] };
}
