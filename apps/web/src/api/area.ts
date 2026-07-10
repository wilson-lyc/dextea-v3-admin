import { createModuleClient, type ApiResponse } from "./client"
import type { Division, ResolveAreaRequest } from "@dextea-admin/contracts"

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

/**
 * 获取行政区划链路（从顶级到指定代码，用于反查省/市/区）
 * GET /areas/:code/path
 */
export function getDivisionPath(code: string) {
  return http.get<ApiResponse<Division[]>>(`/areas/${code}/path`).then((res) => res.data)
}
