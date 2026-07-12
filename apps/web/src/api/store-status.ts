import {
  createModuleClient,
  type ApiResponse,
  type PaginatedData,
} from "./client"
import type {
  StoreProductItem,
  UpdateProductStoreStatusBody,
  StoreCustomizationItem,
  StoreCustomizationOptionItem,
  UpdateOptionStoreStatusBody,
  StoreIngredientItem,
} from "@dextea-admin/contracts/dto"

export type {
  StoreProductItem,
  UpdateProductStoreStatusBody,
  StoreCustomizationItem,
  StoreCustomizationOptionItem,
  UpdateOptionStoreStatusBody,
  StoreIngredientItem,
} from "@dextea-admin/contracts/dto"

const http = createModuleClient("store-status")

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
 * PUT /stores/:storeId/products/:productId/status
 */
export function updateProductStoreStatus(
  storeId: number,
  productId: number,
  data: UpdateProductStoreStatusBody,
) {
  return http
    .put<ApiResponse<null>>(`/stores/${storeId}/products/${productId}/status`, data)
    .then((r) => r.data)
}

/**
 * 门店客制化项目列表（含门店状态）
 * GET /stores/:storeId/customizations
 */
export function getStoreCustomizations(
  storeId: number,
  params?: { page?: number; pageSize?: number },
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
