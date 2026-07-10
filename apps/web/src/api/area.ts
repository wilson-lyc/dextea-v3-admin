import { createModuleClient, type ApiResponse } from "./index"

// ──── DTO ────
export interface Division {
  code: string
  name: string
}

export interface ResolveAreaRequest {
  names: string[]
}

const http = createModuleClient("area")

/**
 * 获取省份列表
 * GET /areas/provinces
 */
export function getProvinces() {
  return http.get<ApiResponse<Division[]>>("/areas/provinces").then((res) => res.data)
}

/**
 * 获取下级行政区划
 * GET /areas/:code/children
 */
export function getChildren(code: string) {
  return http.get<ApiResponse<Division[]>>(`/areas/${code}/children`).then((res) => res.data)
}

/**
 * 解析行政区划名称
 * POST /areas/resolve
 */
export function resolveNames(data: ResolveAreaRequest) {
  return http.post<ApiResponse<Division[]>>("/areas/resolve", data).then((res) => res.data)
}
