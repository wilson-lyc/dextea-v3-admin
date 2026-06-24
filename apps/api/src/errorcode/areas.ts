import type { BizError } from './index.js';

/**
 * 地区服务错误码 (1400-1499)
 */
export const areaErrors = {
  PROVINCES_FAILED: {
    code: 1400,
    message: '获取省份列表失败',
    httpStatus: 500,
  } satisfies BizError,

  CHILDREN_FAILED: {
    code: 1401,
    message: '获取子级地区失败',
    httpStatus: 500,
  } satisfies BizError,

  RESOLVE_FAILED: {
    code: 1402,
    message: '解析地区失败',
    httpStatus: 500,
  } satisfies BizError,

  INVALID_AREA_CODE: {
    code: 1403,
    message: '无效的地区编码',
    httpStatus: 400,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
