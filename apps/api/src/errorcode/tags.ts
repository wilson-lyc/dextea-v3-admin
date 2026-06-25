import type { BizError } from './index.js';

/**
 * 商品标签错误码 (1700-1799)
 */
export const tagErrors = {
  NAME_REQUIRED: {
    code: 10700,
    message: '标签名称不能为空',
    httpStatus: 200,
  } satisfies BizError,

  TAG_NOT_FOUND: {
    code: 10701,
    message: '标签不存在',
    httpStatus: 200,
  } satisfies BizError,

  DUPLICATE_NAME: {
    code: 10702,
    message: '标签名称已存在',
    httpStatus: 200,
  } satisfies BizError,

  LIST_FAILED: {
    code: 10703,
    message: '获取标签列表失败',
    httpStatus: 200,
  } satisfies BizError,

  CREATE_FAILED: {
    code: 10704,
    message: '创建标签失败',
    httpStatus: 200,
  } satisfies BizError,

  UPDATE_FAILED: {
    code: 10705,
    message: '更新标签失败',
    httpStatus: 200,
  } satisfies BizError,

  DELETE_FAILED: {
    code: 10706,
    message: '删除标签失败',
    httpStatus: 200,
  } satisfies BizError,
} as const satisfies Record<string, BizError>;
