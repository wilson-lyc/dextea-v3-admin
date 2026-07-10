import { z } from 'zod/v4';
import type { PaginatedData } from './pagination.js';

/** 统一响应体（前端视角：业务成功时 code===0 且 data 必存在） */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/** 分页响应体 */
export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}

/** 统一响应体校验 schema（后端 Fastify 响应体校验用，data 允许为 null） */
export function ApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    code: z.number(),
    message: z.string(),
    data: dataSchema.nullable(),
  });
}
