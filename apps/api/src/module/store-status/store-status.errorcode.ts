import type { BizErrorCode } from '@/common/types';

/**
 * 门店状态管理错误码 (11200-11299)
 */
export const StoreStatusErrorCodes = {
  LIST_PRODUCTS_FAILED: { code: 11200, message: '获取门店商品状态列表失败' },
  UPDATE_PRODUCT_STATUS_FAILED: { code: 11201, message: '更新门店商品状态失败' },
  LIST_CUSTOMIZATIONS_FAILED: { code: 11202, message: '获取门店客制化状态列表失败' },
  LIST_OPTIONS_FAILED: { code: 11203, message: '获取门店客制化选项状态列表失败' },
  UPDATE_OPTION_STATUS_FAILED: { code: 11204, message: '更新门店客制化选项状态失败' },
  LIST_INGREDIENTS_FAILED: { code: 11205, message: '获取门店原料库存列表失败' },
} as const satisfies Record<string, BizErrorCode>;
