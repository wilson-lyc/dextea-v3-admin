import { z } from 'zod/v4';

/** 登录请求 */
export const LoginRequestSchema = z.object({
  account: z.string().min(1, '账号不能为空').describe('登录账号'),
  password: z.string().min(1, '密码不能为空').describe('密码'),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/** 登录响应 */
export const LoginResponseSchema = z.object({
  token: z.string().describe('登录令牌'),
  user: z.object({
    id: z.number().describe('ID'),
    email: z.string().describe('邮箱'),
    displayName: z.string().describe('显示名称'),
  }),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/** 获取当前登录用户信息响应 */
export const AuthMeResponseSchema = z.object({
  user: z.object({
    id: z.number().describe('ID'),
    email: z.string().describe('邮箱'),
    displayName: z.string().describe('显示名称'),
  }),
});
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;

/** 退出登录响应 */
export const LogoutResponseSchema = z.null();
export type LogoutResponse = null;

/** 修改当前用户密码请求 */
export const ChangePasswordRequestSchema = z.object({
  oldPassword: z.string().min(1, '原密码不能为空').describe('原密码'),
  newPassword: z.string().min(6, '新密码长度不能少于 6 位').describe('新密码'),
});
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

/** 修改当前用户密码响应 */
export const ChangePasswordResponseSchema = z.object({
  success: z.boolean().describe('是否成功'),
});
export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponseSchema>;
