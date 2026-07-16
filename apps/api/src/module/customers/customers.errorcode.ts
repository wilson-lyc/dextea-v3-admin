import type { BizErrorCode } from '@/common/types';

/**
 * 顾客管理错误码 (10700-10799)
 *
 * 当前顾客端仅提供读数据能力（列表查询），无写操作，
 * 以下错误码为后续扩展（如详情/状态变更）预留。
 */
export const CustomerErrorCodes = {
  CUSTOMER_NOT_FOUND: { code: 10701, message: '顾客不存在' },
  LIST_FAILED: { code: 10703, message: '获取顾客列表失败' },
} as const satisfies Record<string, BizErrorCode>;
