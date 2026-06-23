import type { ApiResponse } from '@dextea/shared-types'
import { http } from './http'

export interface Division {
  code: string
  name: string
}

export function getProvinces() {
  return http.get<ApiResponse<Division[]>>('/areas/provinces').then((res) => res.data)
}

export function getChildren(code: string) {
  return http.get<ApiResponse<Division[]>>(`/areas/${code}/children`).then((res) => res.data)
}

export function resolveNames(names: string[]) {
  return http.post<ApiResponse<Division[]>>('/areas/resolve', { names }).then((res) => res.data)
}
