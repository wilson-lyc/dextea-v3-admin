import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

/**
 * 权限实体
 *
 * 权限按「资源:动作」的细粒度设计：
 * - `employee:read`  读取员工数据
 * - `employee:write` 写入员工数据
 * - `employee:*`     员工资源的读写（通配）
 * - `*`              超级权限（所有资源读写）
 *
 * 权限数据为静态表，由工程师手动录入数据库，系统仅提供查询与绑定能力。
 */
export const PermissionSchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string(),
  note: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Permission = z.infer<typeof PermissionSchema>;

/** 权限列表查询（分页 + 关键字） */
export const PermissionListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
});
export type PermissionListRequest = z.infer<typeof PermissionListRequestSchema>;

export const PermissionListResponseSchema = PaginatedDataSchema(PermissionSchema);
export type PermissionListResponse = z.infer<typeof PermissionListResponseSchema>;

/** 权限选项（供角色分配权限时选择使用，返回全部权限） */
export const PermissionOptionSchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string(),
});
export type PermissionOption = z.infer<typeof PermissionOptionSchema>;

export const PermissionOptionListResponseSchema = z.object({
  items: z.array(PermissionOptionSchema),
});
export type PermissionOptionListResponse = z.infer<typeof PermissionOptionListResponseSchema>;
