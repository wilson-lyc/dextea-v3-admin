import type { BizError } from './index.js';

/**
 * 门店状态管理错误码 (11100-11199)
 */
export const storeStatusErrors = {
  LIST_PRODUCTS_FAILED: {
    code: 11100,
    message: '获取门店商品状态列表失败',
    httpStatus: 200,
  } satisfies BizError,

  UPDATE_PRODUCT_STATUS_FAILED: {
    code: 11101,
    message: '更新门店商品状态失败',
    httpStatus: 200,
  } satisfies BizError,

  LIST_CUSTOMIZATIONS_FAILED: {
    code: 11102,
    message: '获取门店客制化状态列表失败',
    httpStatus: 200,
  } satisfies BizError,

  LIST_OPTIONS_FAILED: {
    code: 11103,
    message: '获取门店客制化选项状态列表失败',
    httpStatus: 200,
  } satisfies BizError,

  UPDATE_OPTION_STATUS_FAILED: {
    code: 11104,
    message: '更新门店客制化选项状态失败',
    httpStatus: 200,
  } satisfies BizError,

  LIST_INGREDIENTS_FAILED: {
    code: 11105,
    message: '获取门店原料库存列表失败',
    httpStatus: 200,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
