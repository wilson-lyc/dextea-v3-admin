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
    items: z.array(itemSchema).describe('数据列表'),
    total: z.number().describe('总条数'),
    page: z.number().describe('页码'),
    pageSize: z.number().describe('每页条数'),
  });
}
