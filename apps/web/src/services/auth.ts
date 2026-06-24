import type { ApiResponse, AuthMeResponse, LoginRequest, LoginResponse } from '@dextea/shared-types'
import { http } from './http'

/** POST /auth/login */
export function login(params: LoginRequest) {
  return http.post<ApiResponse<LoginResponse>>('/auth/login', params).then((res) => res.data)
}

/** GET /auth/me */
export function getMe() {
  return http.get<ApiResponse<AuthMeResponse>>('/auth/me').then((res) => res.data)
}

/** POST /auth/logout */
export function logout() {
  return http.post<ApiResponse<null>>('/auth/logout', {}).then((res) => res.data)
}
