import type { ApiResponse, InitStatusData, InitRequest } from '@dextea/shared-types'
import { http } from './http'

/** GET /init/status */
export function getInitStatus() {
  return http.get<ApiResponse<InitStatusData>>('/init/status').then((res) => res.data)
}

/** POST /init */
export function initSystem(params: InitRequest) {
  return http.post<ApiResponse<null>>('/init', params).then((res) => res.data)
}
