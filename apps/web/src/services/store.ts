import type {
  Store,
  StoreStatus,
  ApiResponse,
  PaginatedData,
  CreateStoreInput,
  UpdateStoreInput,
  CreateStoreResponse,
  UpdateStoreResponse,
  UpdateStoreStatusRequest,
  UpdateStoreStatusResponse,
  UpdateStoreBasicInfoRequest,
  UpdateStoreBasicInfoResponse,
  UpdateStoreLocationRequest,
  UpdateStoreLocationResponse,
  ResetStorePasswordResponse,
} from '@dextea/shared-types'
import { http } from './http'

/** GET /stores (paginated) */
export function getStores(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return http
    .get<ApiResponse<PaginatedData<Store>>>('/stores', { params })
    .then((res) => res.data)
}

/** GET /stores/:id */
export function getStore(id: number) {
  return http
    .get<ApiResponse<Store>>(`/stores/${id}`)
    .then((res) => res.data)
}

/** POST /stores */
export function createStore(data: CreateStoreInput) {
  return http
    .post<ApiResponse<CreateStoreResponse>>('/stores', data)
    .then((res) => res.data)
}

/** PUT /stores/:id */
export function updateStore(id: number, data: UpdateStoreInput) {
  return http
    .put<ApiResponse<UpdateStoreResponse>>(`/stores/${id}`, data)
    .then((res) => res.data)
}

/** PATCH /stores/:id/status */
export function updateStoreStatus(id: number, data: UpdateStoreStatusRequest) {
  return http
    .patch<ApiResponse<UpdateStoreStatusResponse>>(`/stores/${id}/status`, data)
    .then((res) => res.data)
}

/** PATCH /stores/:id/basic-info */
export function updateStoreBasicInfo(id: number, data: UpdateStoreBasicInfoRequest) {
  return http
    .patch<ApiResponse<UpdateStoreBasicInfoResponse>>(`/stores/${id}/basic-info`, data)
    .then((res) => res.data)
}

/** PATCH /stores/:id/location */
export function updateStoreLocation(id: number, data: UpdateStoreLocationRequest) {
  return http
    .patch<ApiResponse<UpdateStoreLocationResponse>>(`/stores/${id}/location`, data)
    .then((res) => res.data)
}

/** POST /stores/:id/reset-password */
export function resetStorePassword(id: number) {
  return http
    .post<ApiResponse<ResetStorePasswordResponse>>(`/stores/${id}/reset-password`)
    .then((res) => res.data)
}

/** POST /stores/sync-locations — 同步门店定位数据到 Redis */
export function syncStoreLocations() {
  return http
    .post<ApiResponse<{ synced: number }>>('/stores/sync-locations')
    .then((res) => res.data)
}

// Re-export types used by pages
export type { StoreStatus }
