import type { BizError } from './index.js';

/**
 * 客制化项目错误码 (1800-1899)
 */
export const productCustomizationErrors = {
  NAME_REQUIRED: {
    code: 1800,
    message: '请输入客制化项目名称',
    httpStatus: 400,
  } satisfies BizError,

  NOT_FOUND: {
    code: 1801,
    message: '客制化项目不存在',
    httpStatus: 404,
  } satisfies BizError,

  LIST_FAILED: {
    code: 1802,
    message: '获取客制化项目列表失败',
    httpStatus: 500,
  } satisfies BizError,

  CREATE_FAILED: {
    code: 1803,
    message: '创建客制化项目失败',
    httpStatus: 500,
  } satisfies BizError,

  PRODUCT_NOT_FOUND: {
    code: 1804,
    message: '商品不存在',
    httpStatus: 404,
  } satisfies BizError,

  PRODUCT_ALREADY_BOUND: {
    code: 1805,
    message: '该商品已绑定此客制化项目',
    httpStatus: 400,
  } satisfies BizError,

  BIND_FAILED: {
    code: 1806,
    message: '绑定商品失败',
    httpStatus: 500,
  } satisfies BizError,

  UNBIND_FAILED: {
    code: 1807,
    message: '解绑商品失败',
    httpStatus: 500,
  } satisfies BizError,

  BIND_LIST_FAILED: {
    code: 1808,
    message: '获取绑定的商品列表失败',
    httpStatus: 500,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
