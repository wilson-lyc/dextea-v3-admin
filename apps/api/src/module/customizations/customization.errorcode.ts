import type { BizErrorCode } from '@/common/types';

/**
 * 客制化项目错误码 (10900-10999)
 */
export const CustomizationErrorCodes = {
  NAME_REQUIRED: { code: 10900, message: '请输入客制化项目名称' },
  NOT_FOUND: { code: 10901, message: '客制化项目不存在' },
  LIST_FAILED: { code: 10902, message: '获取客制化项目列表失败' },
  CREATE_FAILED: { code: 10903, message: '创建客制化项目失败' },
  PRODUCT_NOT_FOUND: { code: 10904, message: '商品不存在' },
  UPDATE_FAILED: { code: 10905, message: '更新客制化项目失败' },
  OPTIONS_LIST_FAILED: { code: 10906, message: '获取客制化选项列表失败' },
  OPTION_NOT_FOUND: { code: 10907, message: '客制化选项不存在' },
  OPTION_CREATE_FAILED: { code: 10908, message: '创建客制化选项失败' },
  OPTION_UPDATE_FAILED: { code: 10909, message: '更新客制化选项失败' },
  OPTION_DELETE_FAILED: { code: 10910, message: '删除客制化选项失败' },
  INGREDIENT_NOT_FOUND: { code: 10911, message: '原料不存在' },
  INVALID_STATUS: { code: 10912, message: '无效的状态值' },
  IMPORT_INVALID: { code: 10913, message: '导入的客制化配置无效' },
} as const satisfies Record<string, BizErrorCode>;
