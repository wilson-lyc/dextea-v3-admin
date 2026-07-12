import type { BizErrorCode } from '@/common/types';

/**
 * 门店目录（铺货）错误码 (10400-10499)
 *
 * 负责商品/客制化选项在门店的覆盖状态、原料在门店的库存。
 */
export const StoreCatalogErrorCodes = {
  STORE_NOT_FOUND: { code: 10400, message: '门店不存在' },
} as const satisfies Record<string, BizErrorCode>;
