import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';
import { PermissionOptionSchema } from './permission.js';

/** 角色实体 */
export const RoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  note: z.string().nullable(),
  status: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Role = z.infer<typeof RoleSchema>;

/** 角色列表查询（分页 + 关键字） */
export const RoleListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
});
export type RoleListRequest = z.infer<typeof RoleListRequestSchema>;

export const RoleListResponseSchema = PaginatedDataSchema(RoleSchema);
export type RoleListResponse = z.infer<typeof RoleListResponseSchema>;

/** 创建角色 */
export const CreateRoleRequestSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  note: z.string().optional(),
});
export type CreateRoleRequest = z.infer<typeof CreateRoleRequestSchema>;

export const CreateRoleResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type CreateRoleResponse = z.infer<typeof CreateRoleResponseSchema>;

/** 更新角色 */
export const UpdateRoleRequestSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  note: z.string().optional(),
});
export type UpdateRoleRequest = z.infer<typeof UpdateRoleRequestSchema>;

export const UpdateRoleResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type UpdateRoleResponse = z.infer<typeof UpdateRoleResponseSchema>;

/** 启用/禁用角色（指定目标状态，后端按契约校验合法性） */
export const UpdateRoleStatusRequestSchema = z.object({
  status: z.number(),
});
export type UpdateRoleStatusRequest = z.infer<typeof UpdateRoleStatusRequestSchema>;

export const ToggleRoleStatusResponseSchema = z.object({
  name: z.string(),
  status: z.number(),
});
export type ToggleRoleStatusResponse = z.infer<typeof ToggleRoleStatusResponseSchema>;

/** 角色选项（供员工分配角色时选择使用，返回全部启用角色） */
export const RoleOptionSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type RoleOption = z.infer<typeof RoleOptionSchema>;

export const RoleOptionListResponseSchema = z.object({
  items: z.array(RoleOptionSchema),
});
export type RoleOptionListResponse = z.infer<typeof RoleOptionListResponseSchema>;

/** 获取角色已绑定的权限 */
export const RolePermissionsResponseSchema = z.object({
  permissionIds: z.array(z.number()),
  permissions: z.array(PermissionOptionSchema),
});
export type RolePermissionsResponse = z.infer<typeof RolePermissionsResponseSchema>;

/** 设置角色权限（全量覆盖 = 绑定 + 解绑） */
export const SetRolePermissionsRequestSchema = z.object({
  permissionIds: z.array(z.number().int().positive()),
});
export type SetRolePermissionsRequest = z.infer<typeof SetRolePermissionsRequestSchema>;
