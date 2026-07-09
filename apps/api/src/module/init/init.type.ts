import { z } from 'zod/v4';

// 实体：初始化状态

export const InitStatusSchema = z.object({
  initialized: z.boolean(),
});
export type InitStatus = z.infer<typeof InitStatusSchema>;

// 获取初始化状态

export const InitStatusResponseSchema = InitStatusSchema;
export type InitStatusResponse = InitStatus;

// 系统初始化

export const InitRequestSchema = z.object({
  email: z.string().min(1, '邮箱不能为空'),
  password: z.string().min(1, '密码不能为空'),
  displayName: z.string().min(1, '显示名称不能为空'),
});
export type InitRequest = z.infer<typeof InitRequestSchema>;

export const InitResponseSchema = z.null();
export type InitResponse = null;
