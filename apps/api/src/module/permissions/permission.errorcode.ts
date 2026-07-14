import type { BizErrorCode } from '@/common/types';

/**
 * 权限管理错误码 (11300-11399)
 */
export const PermissionErrorCodes = {
  PERMISSION_NOT_FOUND: { code: 11300, message: '权限不存在' },
  LIST_FAILED: { code: 11301, message: '获取权限列表失败' },
} as const satisfies Record<string, BizErrorCode>;
