import type { BizErrorCode } from '@/common/types';

/**
 * 系统配置错误码 (10600-10699)
 */
export const ConfigErrorCodes = {
  GET_FAILED: { code: 10600, message: '获取配置信息失败' },
  CONFIG_NOT_FOUND: { code: 10601, message: '配置项不存在' },
} as const satisfies Record<string, BizErrorCode>;
