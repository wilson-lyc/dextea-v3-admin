import { createModuleClient, type ApiResponse } from "./client"
import type { AmapConfig } from "@dextea-admin/contracts/dto"

const http = createModuleClient("config")

/**
 * 获取高德地图配置
 * GET /config/amap-key
 */
export function getAmapKey() {
  return http.get<ApiResponse<AmapConfig>>("/config/amap-key").then((res) => res.data)
}
