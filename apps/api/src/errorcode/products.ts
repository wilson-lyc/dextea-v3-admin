import type { BizError } from './index.js';

/**
 * 商品管理错误码 (1800-1899)
 */
export const productErrors = {
  NAME_REQUIRED: {
    code: 10800,
    message: '商品名称不能为空',
    httpStatus: 200,
  } satisfies BizError,

  PRODUCT_NOT_FOUND: {
    code: 10801,
    message: '商品不存在',
    httpStatus: 200,
  } satisfies BizError,

  INVALID_STATUS: {
    code: 10802,
    message: '无效的状态值',
    httpStatus: 200,
  } satisfies BizError,

  LIST_FAILED: {
    code: 10803,
    message: '获取商品列表失败',
    httpStatus: 200,
  } satisfies BizError,

  CREATE_FAILED: {
    code: 10804,
    message: '创建商品失败',
    httpStatus: 200,
  } satisfies BizError,

  UPDATE_FAILED: {
    code: 10805,
    message: '更新商品失败',
    httpStatus: 200,
  } satisfies BizError,

  STATUS_UPDATE_FAILED: {
    code: 10806,
    message: '更新商品状态失败',
    httpStatus: 200,
  } satisfies BizError,

  PRICE_INVALID: {
    code: 10807,
    message: '商品价格无效',
    httpStatus: 200,
  } satisfies BizError,

  TAG_ADD_FAILED: {
    code: 10808,
    message: '添加商品标签失败',
    httpStatus: 200,
  } satisfies BizError,

  TAG_REMOVE_FAILED: {
    code: 10809,
    message: '删除商品标签失败',
    httpStatus: 200,
  } satisfies BizError,

  TAG_ALREADY_EXISTS: {
    code: 10810,
    message: '该标签已关联此商品',
    httpStatus: 200,
  } satisfies BizError,

  CUSTOMIZATION_NOT_FOUND: {
    code: 10811,
    message: '客制化项目不存在',
    httpStatus: 200,
  } satisfies BizError,

  CUSTOMIZATION_ALREADY_BOUND: {
    code: 10812,
    message: '该客制化项目已绑定此商品',
    httpStatus: 200,
  } satisfies BizError,

  CUSTOMIZATION_BIND_FAILED: {
    code: 10813,
    message: '绑定客制化项目失败',
    httpStatus: 200,
  } satisfies BizError,

  CUSTOMIZATION_UNBIND_FAILED: {
    code: 10814,
    message: '解绑客制化项目失败',
    httpStatus: 200,
  } satisfies BizError,

  CUSTOMIZATION_LIST_FAILED: {
    code: 10815,
    message: '获取绑定的客制化项目列表失败',
    httpStatus: 200,
  } satisfies BizError,

  CUSTOMIZATION_BIND_NOT_FOUND: {
    code: 10816,
    message: '客制化项目绑定关系不存在',
    httpStatus: 200,
  } satisfies BizError,

  CUSTOMIZATION_SORT_UPDATE_FAILED: {
    code: 10817,
    message: '更新客制化项目绑定排序失败',
    httpStatus: 200,
  } satisfies BizError,

  INGREDIENT_NOT_FOUND: {
    code: 10818,
    message: '原料不存在',
    httpStatus: 200,
  } satisfies BizError,

  INGREDIENT_ALREADY_BOUND: {
    code: 10819,
    message: '该原料已绑定此商品',
    httpStatus: 200,
  } satisfies BizError,

  INGREDIENT_BIND_NOT_FOUND: {
    code: 10820,
    message: '原料绑定关系不存在',
    httpStatus: 200,
  } satisfies BizError,

  INGREDIENT_BIND_LIST_FAILED: {
    code: 10821,
    message: '获取绑定的原料列表失败',
    httpStatus: 200,
  } satisfies BizError,

  INGREDIENT_BIND_FAILED: {
    code: 10822,
    message: '绑定原料失败',
    httpStatus: 200,
  } satisfies BizError,

  INGREDIENT_UNBIND_FAILED: {
    code: 10823,
    message: '解绑原料失败',
    httpStatus: 200,
  } satisfies BizError,

  INGREDIENT_QUANTITY_UPDATE_FAILED: {
    code: 10824,
    message: '更新原料用量失败',
    httpStatus: 200,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
