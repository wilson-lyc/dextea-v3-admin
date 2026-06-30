import type { Menu, ApiResponse, PaginatedData, CreateMenuInput, UpdateMenuInput, CreateMenuResponse, UpdateMenuResponse } from '@dextea/shared-types'
import { http } from './http'

export function getMenus(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return http.get<ApiResponse<PaginatedData<Menu>>>('/menus', { params }).then((res) => res.data)
}

export function createMenu(data: CreateMenuInput) {
  return http.post<ApiResponse<CreateMenuResponse>>('/menus', data).then((res) => res.data)
}

export function updateMenu(id: number, data: UpdateMenuInput) {
  return http.put<ApiResponse<UpdateMenuResponse>>(`/menus/${id}`, data).then((res) => res.data)
}

export function deleteMenu(id: number) {
  return http.delete<ApiResponse<null>>(`/menus/${id}`).then((res) => res.data)
}

export function getMenu(id: number) {
  return http.get<ApiResponse<Menu>>(`/menus/${id}`).then((res) => res.data)
}
