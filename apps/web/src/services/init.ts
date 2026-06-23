import type { ApiResponse } from '@dextea/shared-types'
import { http } from './http'

export interface InitParams {
  email: string
  password: string
  displayName: string
}

interface InitStatusData {
  initialized: boolean
}

/** GET /init/status */
export function getInitStatus() {
  return http.get<ApiResponse<InitStatusData>>('/init/status').then((res) => res.data)
}

/** POST /init */
export function initSystem(params: InitParams) {
  return http.post<ApiResponse<null>>('/init', params).then((res) => res.data)
}
