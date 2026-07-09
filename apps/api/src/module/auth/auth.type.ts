import { z } from 'zod/v4';

// 实体：认证会话（Redis 中存储的数据）

export const AuthSessionSchema = z.object({
  userId: z.number(),
  email: z.string(),
  displayName: z.string(),
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

// 登录

export const LoginRequestSchema = z.object({
  account: z.string().min(1, '账号不能为空'),
  password: z.string().min(1, '密码不能为空'),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    displayName: z.string(),
  }),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// 获取当前用户信息

export const AuthMeResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    displayName: z.string(),
  }),
});
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;

// 退出登录

export const LogoutResponseSchema = z.null();
export type LogoutResponse = null;
