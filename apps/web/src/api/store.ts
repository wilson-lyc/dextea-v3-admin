import { createModuleClient, type ApiResponse, type PaginatedData } from "./client"
import type {
  Store,
  CreateStoreRequest,
  CreateStoreResponse,
  UpdateStoreStatusRequest,
  UpdateStoreStatusResponse,
  UpdateStoreProfileRequest,
  UpdateStoreProfileResponse,
  UpdateStoreLocationRequest,
  UpdateStoreLocationResponse,
  ResetStorePasswordResponse,
} from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────
export type {
  Store,
  CreateStoreRequest,
  CreateStoreResponse,
  UpdateStoreStatusRequest,
  UpdateStoreStatusResponse,
  UpdateStoreProfileRequest,
  UpdateStoreProfileResponse,
  UpdateStoreLocationRequest,
  UpdateStoreLocationResponse,
  ResetStorePasswordResponse,
} from "@dextea-admin/contracts"
import type {
  StoreProductItem,
  UpdateProductStoreStatusBody,
  StoreCustomizationItem,
  StoreCustomizationOptionItem,
  UpdateOptionStoreStatusBody,
  StoreIngredientItem,
  UpdateStoreIngredientStockBody,
  UpdateStoreIngredientStockResponse,
  BatchUpdateProductStoreStatusResponse,
  BatchUpdateOptionStoreStatusResponse,
} from "@dextea-admin/contracts/dto"

// 门店目录子资源类型（商品/客制化/原料的门店级覆盖）
export type {
  StoreProductItem,
  UpdateProductStoreStatusBody,
  StoreCustomizationItem,
  StoreCustomizationOptionItem,
  UpdateOptionStoreStatusBody,
  StoreIngredientItem,
  BatchUpdateProductStoreStatusBody,
  BatchUpdateProductStoreStatusResponse,
  BatchUpdateOptionStoreStatusBody,
  BatchUpdateOptionStoreStatusResponse,
} from "@dextea-admin/contracts/dto"

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
 * GET /stores/:id/info
 */
export function getStore(id: number) {
  return http.get<ApiResponse<Store>>(`/stores/${id}/info`).then((res) => res.data)
}

/**
 * 新增门店
 * POST /stores
 */
export function createStore(data: CreateStoreRequest) {
  return http
    .post<ApiResponse<CreateStoreResponse>>("/stores", data)
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
 * PATCH /stores/:id/profile
 */
export function updateStoreProfile(id: number, data: UpdateStoreProfileRequest) {
  return http
    .patch<ApiResponse<UpdateStoreProfileResponse>>(`/stores/${id}/profile`, data)
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

/**
 * 门店商品列表（含门店状态）
 * GET /stores/:storeId/products
 */
export function getStoreProducts(
  storeId: number,
  params?: { page?: number; pageSize?: number },
) {
  return http
    .get<ApiResponse<PaginatedData<StoreProductItem>>>(`/stores/${storeId}/products`, { params })
    .then((r) => r.data)
}

/**
 * 设置商品门店状态
 * PATCH /stores/:storeId/products/:productId/status
 */
export function updateProductStoreStatus(
  storeId: number,
  productId: number,
  data: UpdateProductStoreStatusBody,
) {
  return http
    .patch<ApiResponse<null>>(`/stores/${storeId}/products/${productId}/status`, data)
    .then((r) => r.data)
}

/**
 * 批量设置商品门店状态
 * POST /stores/:storeId/products/batch/status
 */
export function batchUpdateProductStoreStatus(
  storeId: number,
  productIds: number[],
  status: number,
) {
  return http
    .post<ApiResponse<BatchUpdateProductStoreStatusResponse>>(
      `/stores/${storeId}/products/batch/status`,
      { productIds, status },
    )
    .then((r) => r.data)
}

/**
 * 门店客制化项目列表（含门店状态）
 * GET /stores/:storeId/customizations
 */
export function getStoreCustomizations(
  storeId: number,
  params?: { page?: number; pageSize?: number; productId?: number },
) {
  return http
    .get<ApiResponse<PaginatedData<StoreCustomizationItem>>>(`/stores/${storeId}/customizations`, {
      params,
    })
    .then((r) => r.data)
}

/**
 * 门店客制化选项列表（含门店状态）
 * GET /stores/:storeId/customizations/:customizationId/options
 */
export function getStoreCustomizationOptions(
  storeId: number,
  customizationId: number,
  params?: { page?: number; pageSize?: number },
) {
  return http
    .get<ApiResponse<PaginatedData<StoreCustomizationOptionItem>>>(
      `/stores/${storeId}/customizations/${customizationId}/options`,
      { params },
    )
    .then((r) => r.data)
}

/**
 * 设置客制化选项门店状态
 * PATCH /stores/:storeId/customization-options/:optionId/status
 */
export function updateCustomizationOptionStoreStatus(
  storeId: number,
  optionId: number,
  data: UpdateOptionStoreStatusBody,
) {
  return http
    .patch<ApiResponse<null>>(
      `/stores/${storeId}/customization-options/${optionId}/status`,
      data,
    )
    .then((r) => r.data)
}

/**
 * 批量设置客制化选项门店状态
 * POST /stores/:storeId/customization-options/batch/status
 */
export function batchUpdateCustomizationOptionStoreStatus(
  storeId: number,
  optionIds: number[],
  status: number,
) {
  return http
    .post<ApiResponse<BatchUpdateOptionStoreStatusResponse>>(
      `/stores/${storeId}/customization-options/batch/status`,
      { optionIds, status },
    )
    .then((r) => r.data)
}

/**
 * 门店原料库存列表
 * GET /stores/:storeId/ingredients
 */
export function getStoreIngredients(
  storeId: number,
  params?: { page?: number; pageSize?: number },
) {
  return http
    .get<ApiResponse<PaginatedData<StoreIngredientItem>>>(`/stores/${storeId}/ingredients`, {
      params,
    })
    .then((r) => r.data)
}

/**
 * 更新门店原料库存
 * PATCH /stores/:storeId/ingredients/:ingredientId/stock
 */
export function updateStoreIngredientStock(
  storeId: number,
  ingredientId: number,
  data: UpdateStoreIngredientStockBody,
) {
  return http
    .patch<ApiResponse<UpdateStoreIngredientStockResponse>>(
      `/stores/${storeId}/ingredients/${ingredientId}/stock`,
      data,
    )
    .then((r) => r.data)
}
