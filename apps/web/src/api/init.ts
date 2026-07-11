import { createModuleClient, type ApiResponse } from "./client"
import type { InitRequest } from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────

export interface InitStatusData {
  initialized: boolean
}

const http = createModuleClient("init")

/**
 * 获取初始化状态
 * GET /init/status
 */
export function getInitStatus() {
  return http.get<ApiResponse<InitStatusData>>("/init/status").then((res) => res.data)
}

/**
 * 初始化系统
 * POST /init
 */
export function initSystem(params: InitRequest) {
  return http.post<ApiResponse<null>>("/init", params).then((res) => res.data)
}
