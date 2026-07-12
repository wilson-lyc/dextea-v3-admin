import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

/** 员工实体 */
export const EmployeeSchema = z.object({
  id: z.number(),
  email: z.string(),
  displayName: z.string(),
  status: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Employee = z.infer<typeof EmployeeSchema>;

/** 员工列表查询 */
export const GetEmployeeListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
});
export type GetEmployeeListRequest = z.infer<typeof GetEmployeeListRequestSchema>;

export const GetEmployeeListResponseSchema = PaginatedDataSchema(EmployeeSchema);
export type GetEmployeeListResponse = z.infer<typeof GetEmployeeListResponseSchema>;

/** 创建员工 */
export const CreateEmployeeRequestSchema = z.object({
  email: z.string().min(1, '邮箱不能为空'),
  displayName: z.string().min(1, '显示名称不能为空'),
});
export type CreateEmployeeRequest = z.infer<typeof CreateEmployeeRequestSchema>;

export const CreateEmployeeResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    displayName: z.string(),
    status: z.number(),
  }),
  initialPassword: z.string(),
});
export type CreateEmployeeResponse = z.infer<typeof CreateEmployeeResponseSchema>;

/** 更新员工 */
export const UpdateEmployeeRequestSchema = z.object({
  email: z.string().min(1, '邮箱不能为空'),
  displayName: z.string().min(1, '显示名称不能为空'),
});
export type UpdateEmployeeRequest = z.infer<typeof UpdateEmployeeRequestSchema>;

export const UpdateEmployeeResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  displayName: z.string(),
});
export type UpdateEmployeeResponse = z.infer<typeof UpdateEmployeeResponseSchema>;

/** 启用/禁用员工 */
export const ToggleEmployeeStatusResponseSchema = z.object({
  email: z.string(),
  status: z.number(),
});
export type ToggleEmployeeStatusResponse = z.infer<typeof ToggleEmployeeStatusResponseSchema>;

/** 重置密码 */
export const ResetEmployeePasswordResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    displayName: z.string(),
    status: z.number(),
  }),
  initialPassword: z.string(),
});
export type ResetEmployeePasswordResponse = z.infer<typeof ResetEmployeePasswordResponseSchema>;
