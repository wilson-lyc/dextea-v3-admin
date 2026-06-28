import type { ApiResponse, AuthMeResponse, LoginRequest, LoginResponse } from '@dextea/shared-types'
import { http } from './http'

/**
 * 用户登录
 * POST /auth/login
 */
export function login(params: LoginRequest) {
  return http.post<ApiResponse<LoginResponse>>('/auth/login', params).then((res) => res.data)
}

/**
 * 获取当前用户信息
 * GET /auth/me
 */
export function getMe() {
  return http.get<ApiResponse<AuthMeResponse>>('/auth/me').then((res) => res.data)
}

/**
 * 用户退出登录
 * POST /auth/logout
 */
export function logout() {
  return http.post<ApiResponse<null>>('/auth/logout', {}).then((res) => res.data)
}
