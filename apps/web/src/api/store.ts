import { createModuleClient, type ApiResponse, type PaginatedData } from "./index"
import type { StoreStatus } from "@/lib/status"

// ──── DTO ────
export interface Store {
  id: number
  name: string
  /** 行政区划代码（6 位，最细一级） */
  regionCode: string
  /** 以下为根据 regionCode 反查得到的展示用名称 */
  province: string
  city: string
  district: string
  address: string
  status: StoreStatus
  businessHours: string
  phone: string
  longitude: number
  latitude: number
  account: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface CreateStoreRequest {
  name: string
  /** 行政区划代码（6 位，最细一级） */
  regionCode: string
  address: string
  businessHours: string
  phone: string
  account: string
  email: string
  longitude?: number
  latitude?: number
}

export interface UpdateStoreRequest {
  name: string
  /** 行政区划代码（6 位，最细一级） */
  regionCode: string
  address: string
  status: StoreStatus
  businessHours: string
  phone: string
  longitude?: number
  latitude?: number
}

export interface CreateStoreResponse {
  id: number
  initialPassword: string
}

export interface UpdateStoreResponse {
  id: number
}

export interface UpdateStoreStatusRequest {
  status: StoreStatus
}

export interface UpdateStoreStatusResponse {
  status: StoreStatus
}

export interface UpdateStoreBasicInfoRequest {
  name: string
  phone: string
  businessHours: string
  email: string
}

export interface UpdateStoreBasicInfoResponse {
  id: number
}

export interface UpdateStoreLocationRequest {
  /** 行政区划代码（6 位，最细一级） */
  regionCode: string
  address: string
  longitude: number
  latitude: number
}

export interface UpdateStoreLocationResponse {
  id: number
}

export interface ResetStorePasswordResponse {
  newPassword: string
}

export interface BindStoreMenuRequest {
  menuId: number | null
}

export interface BindStoreMenuResponse {
  id: number
}

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
