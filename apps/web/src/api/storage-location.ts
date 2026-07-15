import { createModuleClient, type ApiResponse, type PaginatedData } from "./client"
import type {
  CreateStorageLocationRequest,
  StorageLocation,
  StorageLocationListRequest,
  StorageLocationOption,
  TestStorageLocationConnectionRequest,
  UpdateStorageLocationRequest,
} from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────
export type {
  StorageLocation,
  StorageLocationListRequest,
  StorageLocationOption,
  CreateStorageLocationRequest,
  UpdateStorageLocationRequest,
  TestStorageLocationConnectionRequest,
} from "@dextea-admin/contracts"

const http = createModuleClient("storage-location")

/**
 * 获取存储位置列表（分页）
 * GET /storage-locations
 */
export function getStorageLocations(params?: Partial<StorageLocationListRequest>) {
  return http
    .get<ApiResponse<PaginatedData<StorageLocation>>>("/storage-locations", { params })
    .then((res) => res.data)
}

/**
 * 获取启用的存储位置下拉选项
 * GET /storage-locations/options
 */
export function getStorageLocationOptions() {
  return http
    .get<ApiResponse<StorageLocationOption[]>>("/storage-locations/options")
    .then((res) => res.data)
}

/**
 * 新增存储位置
 * POST /storage-locations
 */
export function createStorageLocation(data: CreateStorageLocationRequest) {
  return http
    .post<ApiResponse<{ id: number }>>("/storage-locations", data)
    .then((res) => res.data)
}

/**
 * 更新存储位置
 * PUT /storage-locations/:id
 */
export function updateStorageLocation(id: number, data: UpdateStorageLocationRequest) {
  return http
    .put<ApiResponse<StorageLocation>>(`/storage-locations/${id}`, data)
    .then((res) => res.data)
}

/**
 * 删除存储位置
 * DELETE /storage-locations/:id
 */
export function deleteStorageLocation(id: number) {
  return http
    .delete<ApiResponse<{ id: number }>>(`/storage-locations/${id}`)
    .then((res) => res.data)
}

/**
 * 测试存储连接（使用请求中的明文配置，不落库）
 * POST /storage-locations/test-connection
 */
export function testStorageLocationConnection(data: TestStorageLocationConnectionRequest) {
  return http
    .post<ApiResponse<{ ok: boolean; message: string }>>(
      "/storage-locations/test-connection",
      data,
    )
    .then((res) => res.data)
}
