import type { BizError } from './index.js';

/**
 * 系统配置错误码 (1600-1699)
 */
export const configErrors = {
  GET_FAILED: {
    code: 1600,
    message: '获取配置信息失败',
    httpStatus: 500,
  } satisfies BizError,

  CONFIG_NOT_FOUND: {
    code: 1601,
    message: '配置项不存在',
    httpStatus: 404,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
