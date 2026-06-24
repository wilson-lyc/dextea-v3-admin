import type { BizError } from './index.js';

/**
 * 商品标签错误码 (1700-1799)
 */
export const tagErrors = {
  NAME_REQUIRED: {
    code: 1700,
    message: '标签名称不能为空',
    httpStatus: 400,
  } satisfies BizError,

  TAG_NOT_FOUND: {
    code: 1701,
    message: '标签不存在',
    httpStatus: 404,
  } satisfies BizError,

  DUPLICATE_NAME: {
    code: 1702,
    message: '标签名称已存在',
    httpStatus: 409,
  } satisfies BizError,

  LIST_FAILED: {
    code: 1703,
    message: '获取标签列表失败',
    httpStatus: 500,
  } satisfies BizError,

  CREATE_FAILED: {
    code: 1704,
    message: '创建标签失败',
    httpStatus: 500,
  } satisfies BizError,

  UPDATE_FAILED: {
    code: 1705,
    message: '更新标签失败',
    httpStatus: 500,
  } satisfies BizError,

  DELETE_FAILED: {
    code: 1706,
    message: '删除标签失败',
    httpStatus: 500,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
