/**
 * 商品全局状态
 * 0=下架  1=上架
 *
 * 状态项统一包含三个字段：
 * - key:   稳定的字符串键（用于序列化/枚举标识）
 * - label: 中文语义（用于界面展示，禁止直接展示数字）
 * - value: 数字值（数据库存储 / 接口传输）
 */
export const PRODUCT_STATUS = {
  OFF: { key: 'off', label: '下架', value: 0 },
  ON: { key: 'on', label: '上架', value: 1 },
} as const;

/** 单个状态项类型 */
export type ProductStatusItem = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

/** 状态数字值类型（响应 DTO 中 status 为 z.number()，此处以 number 兼容） */
export type ProductStatus = number;

/** 所有状态值 */
export const PRODUCT_STATUS_VALUES: readonly ProductStatus[] = Object.values(PRODUCT_STATUS).map(
  (s) => s.value,
);

/** value -> 中文 label 映射 */
export const PRODUCT_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(PRODUCT_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

// ──── 商品图片类型（封面图 / 图库，统一存放于 product_images 表） ────
/**
 * 商品图片类型
 * 1=封面图  2=图库
 *
 * 封面图有且仅有一张（允许为空，可后期补）；图库最多 10 张。
 * 同一图片可同时作为封面与图库（以 type 区分，互不冲突）。
 */
export const PRODUCT_IMAGE_TYPE = {
  COVER: { key: 'cover', label: '封面图', value: 1 },
  GALLERY: { key: 'gallery', label: '图库', value: 2 },
} as const;

/** 单个图片类型项类型 */
export type ProductImageTypeItem = (typeof PRODUCT_IMAGE_TYPE)[keyof typeof PRODUCT_IMAGE_TYPE];

/** 所有图片类型值 */
export const PRODUCT_IMAGE_TYPE_VALUES: readonly number[] = Object.values(PRODUCT_IMAGE_TYPE).map(
  (s) => s.value,
);

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

// ──── 门店商品状态（门店级铺货状态，区别于商品全局状态） ────
/**
 * 门店商品状态
 * 0=售罄  1=可售
 *
 * 同一商品的「门店状态」与「全局状态」相互独立：
 * 全局状态决定商品是否在售（上架 / 下架），门店状态决定该门店是否有货（可售 / 售罄）。
 */
export const STORE_PRODUCT_STATUS = {
  SOLD_OUT: { key: 'sold_out', label: '售罄', value: 0 },
  AVAILABLE: { key: 'available', label: '可售', value: 1 },
} as const;

/** 单个状态项类型 */
export type StoreProductStatusItem = (typeof STORE_PRODUCT_STATUS)[keyof typeof STORE_PRODUCT_STATUS];

/** 状态数字值类型（响应 DTO 中 storeStatus 为 z.number()，此处以 number 兼容） */
export type StoreProductStatus = number;

/** 所有状态值 */
export const STORE_PRODUCT_STATUS_VALUES: readonly StoreProductStatus[] = Object.values(
  STORE_PRODUCT_STATUS,
).map((s) => s.value);

/** value -> 中文 label 映射 */
export const STORE_PRODUCT_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(STORE_PRODUCT_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

// ──── 前端展示样式（视图层，按状态值映射到 Tailwind 类） ────

export const STORE_PRODUCT_STATUS_TEXT_CLASSES: Record<number, string> = {
  [STORE_PRODUCT_STATUS.SOLD_OUT.value]: 'text-red-600 dark:text-red-400',
  [STORE_PRODUCT_STATUS.AVAILABLE.value]: 'text-green-600 dark:text-green-400',
};

export const STORE_PRODUCT_STATUS_BADGE_CLASSES: Record<number, string> = {
  [STORE_PRODUCT_STATUS.SOLD_OUT.value]:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30',
  [STORE_PRODUCT_STATUS.AVAILABLE.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};

/** 根据全局状态和门店状态计算最终展示状态 */
export function getProductFinalStatus(globalStatus: number, storeStatus: number) {
  if (globalStatus === PRODUCT_STATUS.OFF.value) {
    return {
      label: PRODUCT_STATUS.OFF.label,
      className: PRODUCT_STATUS_TEXT_CLASSES[PRODUCT_STATUS.OFF.value],
    };
  }
  if (storeStatus === STORE_PRODUCT_STATUS.SOLD_OUT.value) {
    return {
      label: STORE_PRODUCT_STATUS.SOLD_OUT.label,
      className: STORE_PRODUCT_STATUS_TEXT_CLASSES[STORE_PRODUCT_STATUS.SOLD_OUT.value],
    };
  }
  return {
    label: STORE_PRODUCT_STATUS.AVAILABLE.label,
    className: PRODUCT_STATUS_TEXT_CLASSES[PRODUCT_STATUS.ON.value],
  };
}
