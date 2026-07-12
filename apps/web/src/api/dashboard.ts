import { createModuleClient, type ApiResponse } from "./client"
import type { DashboardStats } from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────
export type { DashboardStats } from "@dextea-admin/contracts"

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
