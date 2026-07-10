import { createModuleClient, type ApiResponse, type PaginatedData } from "./client"
import type {
  Store,
  CreateStoreRequest,
  CreateStoreResponse,
  UpdateStoreRequest,
  UpdateStoreResponse,
  UpdateStoreStatusRequest,
  UpdateStoreStatusResponse,
  UpdateStoreBasicInfoRequest,
  UpdateStoreBasicInfoResponse,
  UpdateStoreLocationRequest,
  UpdateStoreLocationResponse,
  ResetStorePasswordResponse,
} from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────
export type {
  Store,
  CreateStoreRequest,
  CreateStoreResponse,
  UpdateStoreRequest,
  UpdateStoreResponse,
  UpdateStoreStatusRequest,
  UpdateStoreStatusResponse,
  UpdateStoreBasicInfoRequest,
  UpdateStoreBasicInfoResponse,
  UpdateStoreLocationRequest,
  UpdateStoreLocationResponse,
  ResetStorePasswordResponse,
  BindStoreMenuRequest,
  BindStoreMenuResponse,
} from "@dextea-admin/contracts"

const http = createModuleClient("store")

/**
 * 获取门店列表（分页）
 * GET /stores
 */
export function getStores(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return http
    .get<ApiResponse<PaginatedData<Store>>>("/stores", { params })
    .then((res) => res.data)
}

/**
 * 获取门店详情
 * GET /stores/:id
 */
export function getStore(id: number) {
  return http.get<ApiResponse<Store>>(`/stores/${id}`).then((res) => res.data)
}

/**
 * 创建门店
 * POST /stores
 */
export function createStore(data: CreateStoreRequest) {
  return http
    .post<ApiResponse<CreateStoreResponse>>("/stores", data)
    .then((res) => res.data)
}

/**
 * 更新门店信息
 * PUT /stores/:id
 */
export function updateStore(id: number, data: UpdateStoreRequest) {
  return http
    .put<ApiResponse<UpdateStoreResponse>>(`/stores/${id}`, data)
    .then((res) => res.data)
}

/**
 * 更新门店状态
 * PATCH /stores/:id/status
 */
export function updateStoreStatus(id: number, data: UpdateStoreStatusRequest) {
  return http
    .patch<ApiResponse<UpdateStoreStatusResponse>>(`/stores/${id}/status`, data)
    .then((res) => res.data)
}

/**
 * 更新门店基本信息
 * PATCH /stores/:id/basic-info
 */
export function updateStoreBasicInfo(id: number, data: UpdateStoreBasicInfoRequest) {
  return http
    .patch<ApiResponse<UpdateStoreBasicInfoResponse>>(`/stores/${id}/basic-info`, data)
    .then((res) => res.data)
}

/**
 * 更新门店位置信息
 * PATCH /stores/:id/location
 */
export function updateStoreLocation(id: number, data: UpdateStoreLocationRequest) {
  return http
    .patch<ApiResponse<UpdateStoreLocationResponse>>(`/stores/${id}/location`, data)
    .then((res) => res.data)
}

/**
 * 重置门店密码
 * POST /stores/:id/reset-password
 */
export function resetStorePassword(id: number) {
  return http
    .post<ApiResponse<ResetStorePasswordResponse>>(`/stores/${id}/reset-password`)
    .then((res) => res.data)
}

/**
 * 同步门店定位数据到 Redis
 * POST /stores/sync-locations
 */
export function syncStoreLocations() {
  return http
    .post<ApiResponse<{ synced: number }>>("/stores/sync-locations")
    .then((res) => res.data)
}
