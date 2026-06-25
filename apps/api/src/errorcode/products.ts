import type { BizError } from './index.js';

/**
 * 商品管理错误码 (1800-1899)
 */
export const productErrors = {
  NAME_REQUIRED: {
    code: 1800,
    message: '商品名称不能为空',
    httpStatus: 400,
  } satisfies BizError,

  PRODUCT_NOT_FOUND: {
    code: 1801,
    message: '商品不存在',
    httpStatus: 404,
  } satisfies BizError,

  INVALID_STATUS: {
    code: 1802,
    message: '无效的状态值',
    httpStatus: 400,
  } satisfies BizError,

  LIST_FAILED: {
    code: 1803,
    message: '获取商品列表失败',
    httpStatus: 500,
  } satisfies BizError,

  CREATE_FAILED: {
    code: 1804,
    message: '创建商品失败',
    httpStatus: 500,
  } satisfies BizError,

  UPDATE_FAILED: {
    code: 1805,
    message: '更新商品失败',
    httpStatus: 500,
  } satisfies BizError,

  STATUS_UPDATE_FAILED: {
    code: 1806,
    message: '更新商品状态失败',
    httpStatus: 500,
  } satisfies BizError,

  PRICE_INVALID: {
    code: 1807,
    message: '商品价格无效',
    httpStatus: 400,
  } satisfies BizError,

  TAG_ADD_FAILED: {
    code: 1808,
    message: '添加商品标签失败',
    httpStatus: 500,
  } satisfies BizError,

  TAG_REMOVE_FAILED: {
    code: 1809,
    message: '删除商品标签失败',
    httpStatus: 500,
  } satisfies BizError,

  TAG_ALREADY_EXISTS: {
    code: 1810,
    message: '该标签已关联此商品',
    httpStatus: 409,
  } satisfies BizError,

  CUSTOMIZATION_NOT_FOUND: {
    code: 1811,
    message: '客制化项目不存在',
    httpStatus: 404,
  } satisfies BizError,

  CUSTOMIZATION_ALREADY_BOUND: {
    code: 1812,
    message: '该客制化项目已绑定此商品',
    httpStatus: 409,
  } satisfies BizError,

  CUSTOMIZATION_BIND_FAILED: {
    code: 1813,
    message: '绑定客制化项目失败',
    httpStatus: 500,
  } satisfies BizError,

  CUSTOMIZATION_UNBIND_FAILED: {
    code: 1814,
    message: '解绑客制化项目失败',
    httpStatus: 500,
  } satisfies BizError,

  CUSTOMIZATION_LIST_FAILED: {
    code: 1815,
    message: '获取绑定的客制化项目列表失败',
    httpStatus: 500,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
