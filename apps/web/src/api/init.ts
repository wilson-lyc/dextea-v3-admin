import { createModuleClient, type ApiResponse } from "./client"

// ──── DTO ────
export interface InitStatusData {
  initialized: boolean
}

export interface InitRequest {
  email: string
  password: string
  displayName: string
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
