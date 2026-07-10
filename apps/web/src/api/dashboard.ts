import { createModuleClient, type ApiResponse } from "./index"

// ──── DTO ────
export interface DashboardStats {
  employeeCount: number
  storeCount: number
}

const http = createModuleClient("dashboard")

/**
 * 获取仪表盘统计数据
 * GET /dashboard/stats
 */
export function getDashboardStats() {
  return http
    .get<ApiResponse<DashboardStats>>("/dashboard/stats")
    .then((res) => res.data)
}
