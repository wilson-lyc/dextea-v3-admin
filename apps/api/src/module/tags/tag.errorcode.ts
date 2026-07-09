import type { BizErrorCode } from '@/common/types';

/**
 * 商品标签错误码 (10700-10799)
 */
export const TagErrorCodes = {
  NAME_REQUIRED: { code: 10700, message: '标签名称不能为空' },
  TAG_NOT_FOUND: { code: 10701, message: '标签不存在' },
  DUPLICATE_NAME: { code: 10702, message: '标签名称已存在' },
  LIST_FAILED: { code: 10703, message: '获取标签列表失败' },
  CREATE_FAILED: { code: 10704, message: '创建标签失败' },
  UPDATE_FAILED: { code: 10705, message: '更新标签失败' },
  DELETE_FAILED: { code: 10706, message: '删除标签失败' },
  PRODUCT_ALREADY_BOUND: { code: 10707, message: '该商品已绑定此标签' },
  BIND_FAILED: { code: 10708, message: '绑定商品失败' },
  UNBIND_FAILED: { code: 10709, message: '解绑商品失败' },
} as const satisfies Record<string, BizErrorCode>;
