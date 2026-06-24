import type { BizError } from './index.js';

/**
 * 门店管理错误码 (1300-1399)
 */
export const storeErrors = {
  NAME_REQUIRED: {
    code: 1300,
    message: '门店名称不能为空',
    httpStatus: 400,
  } satisfies BizError,

  STORE_NOT_FOUND: {
    code: 1301,
    message: '门店不存在',
    httpStatus: 404,
  } satisfies BizError,

  INVALID_STATUS: {
    code: 1302,
    message: '无效的状态值',
    httpStatus: 400,
  } satisfies BizError,

  LIST_FAILED: {
    code: 1303,
    message: '获取门店列表失败',
    httpStatus: 500,
  } satisfies BizError,

  GET_FAILED: {
    code: 1304,
    message: '获取门店信息失败',
    httpStatus: 500,
  } satisfies BizError,

  CREATE_FAILED: {
    code: 1305,
    message: '创建门店失败',
    httpStatus: 500,
  } satisfies BizError,

  UPDATE_FAILED: {
    code: 1306,
    message: '更新门店失败',
    httpStatus: 500,
  } satisfies BizError,

  STATUS_UPDATE_FAILED: {
    code: 1307,
    message: '更新门店状态失败',
    httpStatus: 500,
  } satisfies BizError,

  BASIC_INFO_UPDATE_FAILED: {
    code: 1308,
    message: '更新门店基础信息失败',
    httpStatus: 500,
  } satisfies BizError,

  LOCATION_UPDATE_FAILED: {
    code: 1309,
    message: '更新门店位置失败',
    httpStatus: 500,
  } satisfies BizError,

  SYNC_FAILED: {
    code: 1310,
    message: '同步门店定位数据失败',
    httpStatus: 500,
  } satisfies BizError,

  ACCOUNT_REQUIRED: {
    code: 1313,
    message: '门店登录账号不能为空',
    httpStatus: 400,
  } satisfies BizError,

  ACCOUNT_EXISTS: {
    code: 1314,
    message: '该登录账号已被使用',
    httpStatus: 400,
  } satisfies BizError,

  RESET_PASSWORD_FAILED: {
    code: 1315,
    message: '重置密码失败',
    httpStatus: 500,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
