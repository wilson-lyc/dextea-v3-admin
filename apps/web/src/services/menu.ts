import type {
  Menu,
  MenuGroup,
  MenuProduct,
  ApiResponse,
  PaginatedData,
  CreateMenuInput,
  UpdateMenuInput,
  CreateMenuResponse,
  UpdateMenuResponse,
  CreateMenuGroupInput,
  CreateMenuGroupResponse,
} from '@dextea/shared-types'
import { http } from './http'

export function getMenus(params?: { page?: number; pageSize?: number }) {
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

export function getMenuGroups(menuId: number) {
  return http.get<ApiResponse<MenuGroup[]>>(`/menus/${menuId}/groups`).then((res) => res.data)
}

export function createMenuGroup(menuId: number, data: Omit<CreateMenuGroupInput, 'menuId'>) {
  return http.post<ApiResponse<CreateMenuGroupResponse>>(`/menus/${menuId}/groups`, data).then((res) => res.data)
}

export function deleteMenuGroup(groupIds: number[]) {
  return http.delete<ApiResponse<null>>('/menus/groups', { data: { groupIds } }).then((res) => res.data)
}

export function getMenuGroupProducts(groupId: number) {
  return http.get<ApiResponse<MenuProduct[]>>(`/menus/groups/${groupId}/products`).then((res) => res.data)
}

/**
 * 绑定商品到分组
 * POST /menus/groups/:groupId/products
 */
export function bindMenuProduct(groupId: number, productId: number, sortOrder: number) {
  return http
    .post<ApiResponse<null>>(`/menus/groups/${groupId}/products`, { productId, sortOrder })
    .then((res) => res.data)
}

/**
 * 批量从分组解绑商品
 * DELETE /menus/groups/:groupId/products
 */
export function batchRemoveMenuProducts(groupId: number, productIds: number[]) {
  return http
    .delete<ApiResponse<null>>(`/menus/groups/${groupId}/products`, { data: { productIds } })
    .then((res) => res.data)
}

/**
 * 更新分组商品排序
 * PUT /menus/groups/:groupId/products/sort
 */
export function updateMenuProductSort(groupId: number, productId: number, sortOrder: number) {
  return http
    .put<ApiResponse<null>>(`/menus/groups/${groupId}/products/sort`, { productId, sortOrder })
    .then((res) => res.data)
}
