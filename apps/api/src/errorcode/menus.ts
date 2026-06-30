import type { BizError } from './index.js';

export const menuErrors = {
  NAME_REQUIRED: {
    code: 11112,
    message: '请输入菜单名称',
    httpStatus: 200,
  } satisfies BizError,

  MENU_NOT_FOUND: {
    code: 11101,
    message: '菜单不存在',
    httpStatus: 200,
  } satisfies BizError,

  LIST_FAILED: {
    code: 11102,
    message: '获取菜单列表失败',
    httpStatus: 200,
  } satisfies BizError,

  CREATE_FAILED: {
    code: 11103,
    message: '新建菜单失败',
    httpStatus: 200,
  } satisfies BizError,

  UPDATE_FAILED: {
    code: 11104,
    message: '更新菜单失败',
    httpStatus: 200,
  } satisfies BizError,

  DELETE_FAILED: {
    code: 11105,
    message: '删除菜单失败',
    httpStatus: 200,
  } satisfies BizError,

  GROUP_NOT_FOUND: {
    code: 11106,
    message: '菜单分组不存在',
    httpStatus: 200,
  } satisfies BizError,

  GROUP_CREATE_FAILED: {
    code: 11107,
    message: '新建菜单分组失败',
    httpStatus: 200,
  } satisfies BizError,

  GROUP_UPDATE_FAILED: {
    code: 11108,
    message: '更新菜单分组失败',
    httpStatus: 200,
  } satisfies BizError,

  GROUP_DELETE_FAILED: {
    code: 11109,
    message: '删除菜单分组失败',
    httpStatus: 200,
  } satisfies BizError,

  PRODUCT_BIND_FAILED: {
    code: 11110,
    message: '绑定商品到分组失败',
    httpStatus: 200,
  } satisfies BizError,

  PRODUCT_UNBIND_FAILED: {
    code: 11111,
    message: '从分组移除商品失败',
    httpStatus: 200,
  } satisfies BizError,

  LIST_GROUPS_FAILED: {
    code: 11113,
    message: '获取菜单分组列表失败',
    httpStatus: 200,
  } satisfies BizError,

  LIST_PRODUCTS_FAILED: {
    code: 11114,
    message: '获取分组商品列表失败',
    httpStatus: 200,
  } satisfies BizError,

  PRODUCT_ALREADY_BOUND: {
    code: 11115,
    message: '该商品已在此分组中',
    httpStatus: 200,
  } satisfies BizError,

  DESCRIPTION_TOO_LONG: {
    code: 11116,
    message: '菜单描述不能超过500个字符',
    httpStatus: 200,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
