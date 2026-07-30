export const PRODUCT_STATUS = {
  GLOBAL_DISABLED: { key: 'global_disabled', label: '全局下架', value: 0 },
  GLOBAL_ACTIVE: { key: 'global_active', label: '全局上架', value: 1 },
} as const;

export type ProductStatusItem = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export type ProductStatus = number;

export const PRODUCT_STATUS_VALUES: readonly ProductStatus[] = Object.values(PRODUCT_STATUS).map(
  (s) => s.value,
);

export const PRODUCT_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(PRODUCT_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

export const PRODUCT_IMAGE_TYPE = {
  COVER: { key: 'cover', label: '封面图', value: 1 },
  GALLERY: { key: 'gallery', label: '图库', value: 2 },
} as const;

export type ProductImageTypeItem = (typeof PRODUCT_IMAGE_TYPE)[keyof typeof PRODUCT_IMAGE_TYPE];

export const PRODUCT_IMAGE_TYPE_VALUES: readonly number[] = Object.values(PRODUCT_IMAGE_TYPE).map(
  (s) => s.value,
);

export const PRODUCT_STATUS_TEXT_CLASSES: Record<number, string> = {
  [PRODUCT_STATUS.GLOBAL_DISABLED.value]: 'text-red-600 dark:text-red-400',
  [PRODUCT_STATUS.GLOBAL_ACTIVE.value]: 'text-green-600 dark:text-green-400',
};

export const PRODUCT_STATUS_BADGE_CLASSES: Record<number, string> = {
  [PRODUCT_STATUS.GLOBAL_DISABLED.value]:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30',
  [PRODUCT_STATUS.GLOBAL_ACTIVE.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};

export const STORE_PRODUCT_STATUS = {
  STORE_DISABLED: { key: 'store_disabled', label: '门店售罄', value: 0 },
  STORE_ACTIVE: { key: 'store_active', label: '门店可售', value: 1 },
} as const;

export type StoreProductStatusItem = (typeof STORE_PRODUCT_STATUS)[keyof typeof STORE_PRODUCT_STATUS];

export type StoreProductStatus = number;

export const STORE_PRODUCT_STATUS_VALUES: readonly StoreProductStatus[] = Object.values(
  STORE_PRODUCT_STATUS,
).map((s) => s.value);

export const STORE_PRODUCT_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(STORE_PRODUCT_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

export const STORE_PRODUCT_STATUS_TEXT_CLASSES: Record<number, string> = {
  [STORE_PRODUCT_STATUS.STORE_DISABLED.value]: 'text-red-600 dark:text-red-400',
  [STORE_PRODUCT_STATUS.STORE_ACTIVE.value]: 'text-green-600 dark:text-green-400',
};

export const STORE_PRODUCT_STATUS_BADGE_CLASSES: Record<number, string> = {
  [STORE_PRODUCT_STATUS.STORE_DISABLED.value]:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30',
  [STORE_PRODUCT_STATUS.STORE_ACTIVE.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};

export function getProductFinalStatus(globalStatus: number, storeStatus: number) {
  if (globalStatus === PRODUCT_STATUS.GLOBAL_DISABLED.value) {
    return {
      label: PRODUCT_STATUS.GLOBAL_DISABLED.label,
      className: PRODUCT_STATUS_TEXT_CLASSES[PRODUCT_STATUS.GLOBAL_DISABLED.value],
    };
  }
  if (storeStatus === STORE_PRODUCT_STATUS.STORE_DISABLED.value) {
    return {
      label: STORE_PRODUCT_STATUS.STORE_DISABLED.label,
      className: STORE_PRODUCT_STATUS_TEXT_CLASSES[STORE_PRODUCT_STATUS.STORE_DISABLED.value],
    };
  }
  return {
    label: STORE_PRODUCT_STATUS.STORE_ACTIVE.label,
    className: PRODUCT_STATUS_TEXT_CLASSES[PRODUCT_STATUS.GLOBAL_ACTIVE.value],
  };
}
