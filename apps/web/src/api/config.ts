import { createModuleClient, type ApiResponse } from "./index"

// ──── DTO ────
export interface AmapConfig {
  key: string
  securityCode: string
}

const http = createModuleClient("config")

/**
 * 获取高德地图配置
 * GET /config/amap-key
 */
export function getAmapKey() {
  return http.get<ApiResponse<AmapConfig>>("/config/amap-key").then((res) => res.data)
}
