import type { Store, StoreStatus, ApiResponse, PaginatedData } from '@dextea/shared-types'
import { http } from './http'

export interface CreateStoreData {
  name: string
  province: string
  city: string
  district: string
  address: string
  businessHours: string
  phone: string
}

export interface UpdateStoreData {
  name: string
  province: string
  city: string
  district: string
  address: string
  status: StoreStatus
  businessHours: string
  phone: string
}

export interface UpdateStoreStatusResult {
  status: StoreStatus
}

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
export function createStore(data: CreateStoreData) {
  return http
    .post<ApiResponse<{ id: number }>>('/stores', data)
    .then((res) => res.data)
}

/** PUT /stores/:id */
export function updateStore(id: number, data: UpdateStoreData) {
  return http
    .put<ApiResponse<{ id: number }>>(`/stores/${id}`, data)
    .then((res) => res.data)
}

/** PATCH /stores/:id/status */
export function updateStoreStatus(id: number, status: StoreStatus) {
  return http
    .patch<ApiResponse<UpdateStoreStatusResult>>(`/stores/${id}/status`, { status })
    .then((res) => res.data)
}
