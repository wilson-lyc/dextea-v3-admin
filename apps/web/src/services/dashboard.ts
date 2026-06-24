import type { ApiResponse, DashboardStats } from '@dextea/shared-types'
import { http } from './http'

/** GET /dashboard/stats */
export function getDashboardStats() {
  return http
    .get<ApiResponse<DashboardStats>>('/dashboard/stats')
    .then((res) => res.data)
}
