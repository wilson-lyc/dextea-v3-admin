import type { BizErrorCode } from '@/common/types';

/**
 * 门店管理错误码 (10300-10399)
 */
export const StoreErrorCodes = {
  NAME_REQUIRED: { code: 10300, message: '门店名称不能为空' },
  STORE_NOT_FOUND: { code: 10301, message: '门店不存在' },
  INVALID_STATUS: { code: 10302, message: '无效的状态值' },
  LIST_FAILED: { code: 10303, message: '获取门店列表失败' },
  GET_FAILED: { code: 10304, message: '获取门店信息失败' },
  CREATE_FAILED: { code: 10305, message: '创建门店失败' },
  UPDATE_FAILED: { code: 10306, message: '更新门店失败' },
  STATUS_UPDATE_FAILED: { code: 10307, message: '更新门店状态失败' },
  BASIC_INFO_UPDATE_FAILED: { code: 10308, message: '更新门店基础信息失败' },
  LOCATION_UPDATE_FAILED: { code: 10309, message: '更新门店位置失败' },
  SYNC_FAILED: { code: 10310, message: '同步门店定位数据失败' },
  ACCOUNT_REQUIRED: { code: 10311, message: '门店登录账号不能为空' },
  ACCOUNT_EXISTS: { code: 10312, message: '该登录账号已被使用' },
  RESET_PASSWORD_FAILED: { code: 10313, message: '重置密码失败' },
  MENU_BIND_FAILED: { code: 10314, message: '绑定菜单失败' },
  MENU_NOT_FOUND: { code: 10315, message: '菜单不存在' },
  INVALID_REGION_CODE: { code: 10316, message: '无效的行政区划代码' },
} as const satisfies Record<string, BizErrorCode>;
