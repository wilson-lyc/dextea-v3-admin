import type { BizErrorCode } from '@/common/types';

/**
 * 地区服务错误码 (10400-10499)
 */
export const AreaErrorCodes = {
  PROVINCES_FAILED: { code: 10400, message: '获取省份列表失败' },
  CHILDREN_FAILED: { code: 10401, message: '获取子级地区失败' },
  RESOLVE_FAILED: { code: 10402, message: '解析地区失败' },
  INVALID_AREA_CODE: { code: 10403, message: '无效的地区编码' },
} as const satisfies Record<string, BizErrorCode>;
