import type { BizError } from './index.js';

/**
 * 门店管理错误码 (1300-1399)
 */
export const storeErrors = {
  NAME_REQUIRED: {
    code: 10300,
    message: '门店名称不能为空',
    httpStatus: 200,
  } satisfies BizError,

  STORE_NOT_FOUND: {
    code: 10301,
    message: '门店不存在',
    httpStatus: 200,
  } satisfies BizError,

  INVALID_STATUS: {
    code: 10302,
    message: '无效的状态值',
    httpStatus: 200,
  } satisfies BizError,

  LIST_FAILED: {
    code: 10303,
    message: '获取门店列表失败',
    httpStatus: 200,
  } satisfies BizError,

  GET_FAILED: {
    code: 10304,
    message: '获取门店信息失败',
    httpStatus: 200,
  } satisfies BizError,

  CREATE_FAILED: {
    code: 10305,
    message: '创建门店失败',
    httpStatus: 200,
  } satisfies BizError,

  UPDATE_FAILED: {
    code: 10306,
    message: '更新门店失败',
    httpStatus: 200,
  } satisfies BizError,

  STATUS_UPDATE_FAILED: {
    code: 10307,
    message: '更新门店状态失败',
    httpStatus: 200,
  } satisfies BizError,

  BASIC_INFO_UPDATE_FAILED: {
    code: 10308,
    message: '更新门店基础信息失败',
    httpStatus: 200,
  } satisfies BizError,

  LOCATION_UPDATE_FAILED: {
    code: 10309,
    message: '更新门店位置失败',
    httpStatus: 200,
  } satisfies BizError,

  SYNC_FAILED: {
    code: 10310,
    message: '同步门店定位数据失败',
    httpStatus: 200,
  } satisfies BizError,

  ACCOUNT_REQUIRED: {
    code: 10313,
    message: '门店登录账号不能为空',
    httpStatus: 200,
  } satisfies BizError,

  ACCOUNT_EXISTS: {
    code: 10314,
    message: '该登录账号已被使用',
    httpStatus: 200,
  } satisfies BizError,

  RESET_PASSWORD_FAILED: {
    code: 10315,
    message: '重置密码失败',
    httpStatus: 200,
  } satisfies BizError,

  MENU_BIND_FAILED: {
    code: 10316,
    message: '绑定菜单失败',
    httpStatus: 200,
  } satisfies BizError,

  MENU_NOT_FOUND: {
    code: 10317,
    message: '菜单不存在',
    httpStatus: 200,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
