import type { ApiResponse } from '@dextea/shared-types'
import { http } from './http'

export interface LoginParams {
  account: string
  password: string
}

export interface LoginData {
  token: string
  user: {
    id: number
    email: string
    displayName: string
  }
}

/** POST /auth/login */
export function login(params: LoginParams) {
  return http.post<ApiResponse<LoginData>>('/auth/login', params).then((res) => res.data)
}

/** POST /auth/logout */
export function logout() {
  return http.post<ApiResponse<null>>('/auth/logout', {}).then((res) => res.data)
}
