import type { BizError } from './index.js';

/**
 * 客制化项目错误码 (10900-10999)
 */
export const productCustomizationErrors = {
  NAME_REQUIRED: {
    code: 10900,
    message: '请输入客制化项目名称',
    httpStatus: 200,
  } satisfies BizError,

  DISPLAY_NAME_REQUIRED: {
    code: 10909,
    message: '请输入展示名称',
    httpStatus: 200,
  } satisfies BizError,

  NOT_FOUND: {
    code: 10901,
    message: '客制化项目不存在',
    httpStatus: 200,
  } satisfies BizError,

  LIST_FAILED: {
    code: 10902,
    message: '获取客制化项目列表失败',
    httpStatus: 200,
  } satisfies BizError,

  CREATE_FAILED: {
    code: 10903,
    message: '创建客制化项目失败',
    httpStatus: 200,
  } satisfies BizError,

  PRODUCT_NOT_FOUND: {
    code: 10904,
    message: '商品不存在',
    httpStatus: 200,
  } satisfies BizError,

  PRODUCT_ALREADY_BOUND: {
    code: 10905,
    message: '该商品已绑定此客制化项目',
    httpStatus: 200,
  } satisfies BizError,

  BIND_FAILED: {
    code: 10906,
    message: '绑定商品失败',
    httpStatus: 200,
  } satisfies BizError,

  UNBIND_FAILED: {
    code: 10907,
    message: '解绑商品失败',
    httpStatus: 200,
  } satisfies BizError,

  BIND_LIST_FAILED: {
    code: 10908,
    message: '获取绑定的商品列表失败',
    httpStatus: 200,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
