import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';
import { RoleOptionSchema } from './role.js';

/** 员工实体 */
export const EmployeeSchema = z.object({
  id: z.number().describe('ID'),
  email: z.string().describe('邮箱'),
  displayName: z.string().describe('显示名称'),
  status: z.number().describe('状态'),
  createdAt: z.string().describe('创建时间'),
  updatedAt: z.string().describe('更新时间'),
});
export type Employee = z.infer<typeof EmployeeSchema>;

/** 员工列表查询 */
export const GetEmployeeListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('页大小'),
  keyword: z.string().optional().describe('关键字'),
});
export type GetEmployeeListRequest = z.infer<typeof GetEmployeeListRequestSchema>;

export const GetEmployeeListResponseSchema = PaginatedDataSchema(EmployeeSchema);
export type GetEmployeeListResponse = z.infer<typeof GetEmployeeListResponseSchema>;

/** 创建员工 */
export const CreateEmployeeRequestSchema = z.object({
  email: z.string().min(1, '邮箱不能为空').max(128, '邮箱长度不能超过 128 个字符').describe('邮箱'),
  displayName: z.string().trim().min(1, '显示名称不能为空').max(32, '显示名称长度不能超过 32 个字符').describe('显示名称'),
});
export type CreateEmployeeRequest = z.infer<typeof CreateEmployeeRequestSchema>;

export const CreateEmployeeResponseSchema = z.object({
  initialPassword: z.string().describe('初始密码'),
});
export type CreateEmployeeResponse = z.infer<typeof CreateEmployeeResponseSchema>;

/** 更新员工基础信息 */
export const UpdateEmployeeProfileRequestSchema = z.object({
  email: z.string().min(1, '邮箱不能为空').max(128, '邮箱长度不能超过 128 个字符').describe('邮箱'),
  displayName: z.string().trim().min(1, '显示名称不能为空').max(32, '显示名称长度不能超过 32 个字符').describe('显示名称'),
});
export type UpdateEmployeeProfileRequest = z.infer<typeof UpdateEmployeeProfileRequestSchema>;

export const UpdateEmployeeProfileResponseSchema = z.object({
  id: z.number().describe('ID'),
  email: z.string().describe('邮箱'),
  displayName: z.string().describe('显示名称'),
});
export type UpdateEmployeeProfileResponse = z.infer<typeof UpdateEmployeeProfileResponseSchema>;

/** 启用/禁用员工 */
export const UpdateEmployeeStatusRequestSchema = z.object({
  status: z.number().describe('状态'),
});
export type UpdateEmployeeStatusRequest = z.infer<typeof UpdateEmployeeStatusRequestSchema>;

export const ToggleEmployeeStatusResponseSchema = z.object({
  status: z.number().describe('状态'),
});
export type ToggleEmployeeStatusResponse = z.infer<typeof ToggleEmployeeStatusResponseSchema>;

/** 重置密码 */
export const ResetEmployeePasswordResponseSchema = z.object({
  initialPassword: z.string().describe('初始密码'),
});
export type ResetEmployeePasswordResponse = z.infer<typeof ResetEmployeePasswordResponseSchema>;

/** 获取员工已绑定的角色 */
export const EmployeeRolesResponseSchema = z.object({
  roleIds: z.array(z.number()).describe('角色ID列表'),
  roles: z.array(RoleOptionSchema).describe('角色列表'),
});
export type EmployeeRolesResponse = z.infer<typeof EmployeeRolesResponseSchema>;

/** 设置员工角色 */
export const SetEmployeeRolesRequestSchema = z.object({
  roleIds: z.array(z.number().int().positive()).describe('角色ID列表'),
});
export type SetEmployeeRolesRequest = z.infer<typeof SetEmployeeRolesRequestSchema>;
