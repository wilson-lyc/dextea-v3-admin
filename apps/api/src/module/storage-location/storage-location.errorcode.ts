import type { BizErrorCode } from '@/common/types';

/**
 * 存储位置模块错误码 (12000-12099)
 */
export const StorageLocationErrorCodes = {
  NOT_FOUND: { code: 12001, message: '存储位置不存在' },
  NAME_CONFLICT: { code: 12002, message: '存储位置名称已存在' },
  CREATE_FAILED: { code: 12003, message: '存储位置创建失败' },
  UPDATE_FAILED: { code: 12004, message: '存储位置更新失败' },
  DELETE_FAILED: { code: 12005, message: '存储位置删除失败' },
  TEST_FAILED: { code: 12006, message: '连接测试失败' },
  LIST_FAILED: { code: 12007, message: '获取存储位置列表失败' },
} as const satisfies Record<string, BizErrorCode>;
