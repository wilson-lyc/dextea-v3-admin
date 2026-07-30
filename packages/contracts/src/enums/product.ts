import { defineStatus } from './factory.js'

const _product = defineStatus(
  {
    GLOBAL_DISABLED: { key: 'global_disabled', label: '全局下架', value: 0 },
    GLOBAL_ACTIVE: { key: 'global_active', label: '全局上架', value: 1 },
  } as const,
  { 0: 'red', 1: 'green' },
)

export const PRODUCT_STATUS = _product.items
export type ProductStatusItem = typeof _product.Item
export type ProductStatus = number
export const PRODUCT_STATUS_VALUES = _product.values
export const PRODUCT_STATUS_LABEL = _product.label
export const PRODUCT_STATUS_TEXT_CLASSES = _product.textClasses
export const PRODUCT_STATUS_BADGE_CLASSES = _product.badgeClasses

const _storeProduct = defineStatus(
  {
    STORE_DISABLED: { key: 'store_disabled', label: '门店售罄', value: 0 },
    STORE_ACTIVE: { key: 'store_active', label: '门店可售', value: 1 },
  } as const,
  { 0: 'red', 1: 'green' },
)

export const STORE_PRODUCT_STATUS = _storeProduct.items
export type StoreProductStatusItem = typeof _storeProduct.Item
export type StoreProductStatus = number
export const STORE_PRODUCT_STATUS_VALUES = _storeProduct.values
export const STORE_PRODUCT_STATUS_LABEL = _storeProduct.label
export const STORE_PRODUCT_STATUS_TEXT_CLASSES = _storeProduct.textClasses
export const STORE_PRODUCT_STATUS_BADGE_CLASSES = _storeProduct.badgeClasses

const _productImage = defineStatus({
  COVER: { key: 'cover', label: '封面图', value: 1 },
  GALLERY: { key: 'gallery', label: '图库', value: 2 },
} as const)

export const PRODUCT_IMAGE_TYPE = _productImage.items
export type ProductImageTypeItem = typeof _productImage.Item
export const PRODUCT_IMAGE_TYPE_VALUES = _productImage.values

export function getProductFinalStatus(globalStatus: number, storeStatus: number) {
  if (globalStatus === PRODUCT_STATUS.GLOBAL_DISABLED.value) {
    return {
      label: PRODUCT_STATUS.GLOBAL_DISABLED.label,
      className: PRODUCT_STATUS_TEXT_CLASSES[PRODUCT_STATUS.GLOBAL_DISABLED.value],
    }
  }
  if (storeStatus === STORE_PRODUCT_STATUS.STORE_DISABLED.value) {
    return {
      label: STORE_PRODUCT_STATUS.STORE_DISABLED.label,
      className: STORE_PRODUCT_STATUS_TEXT_CLASSES[STORE_PRODUCT_STATUS.STORE_DISABLED.value],
    }
  }
  return {
    label: STORE_PRODUCT_STATUS.STORE_ACTIVE.label,
    className: PRODUCT_STATUS_TEXT_CLASSES[PRODUCT_STATUS.GLOBAL_ACTIVE.value],
  }
}
