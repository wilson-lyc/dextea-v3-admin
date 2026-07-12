import { createModuleClient, type ApiResponse, type PaginatedData } from "./client"
import type { Store } from "./store"
import type {
  Menu,
  MenuGroup,
  MenuProduct,
  CreateMenuRequest,
  UpdateMenuRequest,
  CreateMenuResponse,
  UpdateMenuResponse,
  CreateMenuGroupRequest,
  CreateMenuGroupResponse,
  DispatchByAreaRequest,
  DispatchByAreaResponse,
  DispatchByIdRequest,
  DispatchByIdResponse,
} from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────
export type {
  Menu,
  MenuGroup,
  MenuProduct,
  CreateMenuRequest,
  UpdateMenuRequest,
  CreateMenuResponse,
  UpdateMenuResponse,
  CreateMenuGroupRequest,
  CreateMenuGroupResponse,
  DispatchByAreaRequest,
  DispatchByAreaResponse,
  DispatchByIdRequest,
  DispatchByIdResponse,
} from "@dextea-admin/contracts"

const http = createModuleClient("menu")

export function getMenus(params?: { page?: number; pageSize?: number }) {
  return http.get<ApiResponse<PaginatedData<Menu>>>("/menus", { params }).then((res) => res.data)
}

export function createMenu(data: CreateMenuRequest) {
  return http.post<ApiResponse<CreateMenuResponse>>("/menus", data).then((res) => res.data)
}

export function updateMenu(id: number, data: UpdateMenuRequest) {
  return http.put<ApiResponse<UpdateMenuResponse>>(`/menus/${id}`, data).then((res) => res.data)
}

export function deleteMenu(id: number) {
  return batchDeleteMenus([id])
}

export function batchDeleteMenus(menuIds: number[]) {
  return http.delete<ApiResponse<null>>("/menus", { data: { menuIds } }).then((res) => res.data)
}

/**
 * 获取菜单详情
 * GET /menus/:id/info
 */
export function getMenu(id: number) {
  return http.get<ApiResponse<Menu>>(`/menus/${id}/info`).then((res) => res.data)
}

export function getMenuGroups(menuId: number) {
  return http.get<ApiResponse<MenuGroup[]>>(`/menus/${menuId}/groups`).then((res) => res.data)
}

export function createMenuGroup(menuId: number, data: Omit<CreateMenuGroupRequest, "menuId">) {
  return http
    .post<ApiResponse<CreateMenuGroupResponse>>(`/menus/${menuId}/groups`, data)
    .then((res) => res.data)
}

export function deleteMenuGroup(groupIds: number[]) {
  return http
    .delete<ApiResponse<null>>("/menus/groups", { data: { groupIds } })
    .then((res) => res.data)
}

export function getMenuGroupProducts(groupId: number) {
  return http
    .get<ApiResponse<MenuProduct[]>>(`/menus/groups/${groupId}/products`)
    .then((res) => res.data)
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
 * PATCH /menus/groups/:groupId/products/sort
 */
export function updateMenuProductSort(groupId: number, productId: number, sortOrder: number) {
  return http
    .patch<ApiResponse<null>>(`/menus/groups/${groupId}/products/sort`, { productId, sortOrder })
    .then((res) => res.data)
}

/**
 * 获取菜单关联的门店列表
 * GET /menus/:id/stores
 */
export function getStoresByMenuId(menuId: number, params?: { page?: number; pageSize?: number }) {
  return http
    .get<ApiResponse<PaginatedData<Store>>>(`/menus/${menuId}/stores`, { params })
    .then((res) => res.data)
}

/**
 * 按地域分发菜单
 * POST /menus/:id/dispatch/area
 */
export function dispatchMenuByArea(menuId: number, data: DispatchByAreaRequest) {
  return http
    .post<ApiResponse<DispatchByAreaResponse>>(`/menus/${menuId}/dispatch/area`, data)
    .then((res) => res.data)
}

/**
 * 按ID分发菜单
 * POST /menus/:id/dispatch/id
 */
export function dispatchMenuById(menuId: number, data: DispatchByIdRequest) {
  return http
    .post<ApiResponse<DispatchByIdResponse>>(`/menus/${menuId}/dispatch/id`, data)
    .then((res) => res.data)
}
