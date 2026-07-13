import type { BizErrorCode } from '@/common/types';

/**
 * 原料管理错误码 (11000-11099)
 */
export const IngredientErrorCodes = {
  NAME_REQUIRED: { code: 11000, message: '原料名称不能为空' },
  UNIT_REQUIRED: { code: 11001, message: '单位不能为空' },
  INGREDIENT_NOT_FOUND: { code: 11002, message: '原料不存在' },
  INVALID_STATUS: { code: 11003, message: '无效的状态值' },
  LIST_FAILED: { code: 11004, message: '获取原料列表失败' },
  CREATE_FAILED: { code: 11005, message: '创建原料失败' },
  UPDATE_FAILED: { code: 11006, message: '更新原料失败' },
  STATUS_UPDATE_FAILED: { code: 11007, message: '更新原料状态失败' },
} as const satisfies Record<string, BizErrorCode>;
