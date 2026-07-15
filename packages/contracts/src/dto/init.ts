import { z } from 'zod/v4';

/** 初始化状态 */
export const InitStatusSchema = z.object({ initialized: z.boolean() });
export type InitStatus = z.infer<typeof InitStatusSchema>;

export const InitStatusResponseSchema = InitStatusSchema;
export type InitStatusResponse = InitStatus;

/** 系统初始化 */
export const InitRequestSchema = z.object({
  email: z.string().min(1, '邮箱不能为空').email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空').min(6, '密码长度不能少于 6 位'),
  displayName: z
    .string()
    .min(1, '显示名称不能为空')
    .max(255, '显示名称长度不能超过 255 个字符'),
});
export type InitRequest = z.infer<typeof InitRequestSchema>;

export const InitResponseSchema = z.null();
export type InitResponse = null;
