import type { BizError } from './index.js';

/**
 * 原料管理错误码 (11000-11099)
 */
export const ingredientErrors = {
  NAME_REQUIRED: {
    code: 11000,
    message: '原料名称不能为空',
    httpStatus: 200,
  } satisfies BizError,

  UNIT_REQUIRED: {
    code: 11001,
    message: '单位不能为空',
    httpStatus: 200,
  } satisfies BizError,

  INGREDIENT_NOT_FOUND: {
    code: 11002,
    message: '原料不存在',
    httpStatus: 200,
  } satisfies BizError,

  INVALID_STATUS: {
    code: 11003,
    message: '无效的状态值',
    httpStatus: 200,
  } satisfies BizError,

  LIST_FAILED: {
    code: 11004,
    message: '获取原料列表失败',
    httpStatus: 200,
  } satisfies BizError,

  CREATE_FAILED: {
    code: 11005,
    message: '创建原料失败',
    httpStatus: 200,
  } satisfies BizError,

  UPDATE_FAILED: {
    code: 11006,
    message: '更新原料失败',
    httpStatus: 200,
  } satisfies BizError,

  STATUS_UPDATE_FAILED: {
    code: 11007,
    message: '更新原料状态失败',
    httpStatus: 200,
  } satisfies BizError,

  PRODUCT_ALREADY_BOUND: {
    code: 11008,
    message: '该商品已绑定此原料',
    httpStatus: 200,
  } satisfies BizError,

  BIND_NOT_FOUND: {
    code: 11009,
    message: '绑定关系不存在',
    httpStatus: 200,
  } satisfies BizError,

  PRODUCT_NOT_FOUND: {
    code: 11010,
    message: '商品不存在',
    httpStatus: 200,
  } satisfies BizError,

  BIND_LIST_FAILED: {
    code: 11011,
    message: '获取绑定商品列表失败',
    httpStatus: 200,
  } satisfies BizError,

  BIND_FAILED: {
    code: 11012,
    message: '绑定商品失败',
    httpStatus: 200,
  } satisfies BizError,

  BIND_QUANTITY_UPDATE_FAILED: {
    code: 11013,
    message: '更新用量失败',
    httpStatus: 200,
  } satisfies BizError,

  UNBIND_FAILED: {
    code: 11014,
    message: '解绑失败',
    httpStatus: 200,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
