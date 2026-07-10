import { createModuleClient, type ApiResponse } from "./client"

// ──── DTO ────
export interface HealthData {
  status: string
  timestamp: string
}

export type HealthResponse = ApiResponse<HealthData>

const http = createModuleClient("health")

/**
 * 健康检查
 * GET /health
 */
export function getHealth() {
  return http.get<HealthResponse>("/health").then((res) => res.data)
}
