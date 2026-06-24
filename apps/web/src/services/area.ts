import type { ApiResponse, Division, ResolveAreaRequest } from '@dextea/shared-types'
import { http } from './http'

export function getProvinces() {
  return http.get<ApiResponse<Division[]>>('/areas/provinces').then((res) => res.data)
}

export function getChildren(code: string) {
  return http.get<ApiResponse<Division[]>>(`/areas/${code}/children`).then((res) => res.data)
}

export function resolveNames(data: ResolveAreaRequest) {
  return http.post<ApiResponse<Division[]>>('/areas/resolve', data).then((res) => res.data)
}
