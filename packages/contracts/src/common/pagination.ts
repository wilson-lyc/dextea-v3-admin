import { z } from 'zod/v4';

/** 分页数据结构（前后端共享） */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 分页结构校验 schema（后端 Fastify 响应体校验用） */
export function PaginatedDataSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  });
}
