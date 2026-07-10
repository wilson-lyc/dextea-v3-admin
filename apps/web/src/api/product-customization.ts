import {
  createModuleClient,
  type ApiResponse,
  type PaginatedData,
} from "./index"
import type { ProductCustomizationStatus, CustomizationOptionStatus } from "@/lib/status"

// ──── DTO ────
export interface ProductCustomization {
  id: number
  productId: number
  name: string
  status: ProductCustomizationStatus
  optionCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateProductCustomizationRequest {
  productId: number
  name: string
}

export interface UpdateProductCustomizationRequest {
  name: string
  status?: ProductCustomizationStatus
}

export interface CustomizationOption {
  id: number
  customizationId: number
  name: string
  price: number
  sort: number
  status: CustomizationOptionStatus
  ingredientId: number | null
  ingredientName: string | null
  quantity: number
  createdAt: string
  updatedAt: string
}

export interface CreateCustomizationOptionRequest {
  name: string
  price?: number
  sort?: number
  ingredientId?: number | null
  quantity?: number
}

export interface UpdateCustomizationOptionRequest {
  name?: string
  price?: number
  sort?: number
  status?: CustomizationOptionStatus
  ingredientId?: number | null
  quantity?: number
}

const http = createModuleClient("product-customization")

/**
 * 获取客制化项目列表（分页）
 * GET /product-customizations
 */
export function getProductCustomizations(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: number
  productId?: number
}) {
  return http
    .get<ApiResponse<PaginatedData<ProductCustomization>>>("/product-customizations", { params })
    .then((res) => res.data)
}

/**
 * 获取客制化项目详情
 * GET /product-customizations/:id
 */
export function getProductCustomization(id: number) {
  return http
    .get<ApiResponse<ProductCustomization>>(`/product-customizations/${id}`)
    .then((res) => res.data)
}

/**
 * 更新客制化项目
 * PATCH /product-customizations/:id
 */
export function updateProductCustomization(id: number, data: UpdateProductCustomizationRequest) {
  return http
    .patch<ApiResponse<ProductCustomization>>(`/product-customizations/${id}`, data)
    .then((res) => res.data)
}

/**
 * 单独更新客制化项目状态
 * PATCH /product-customizations/:id/status
 */
export function updateProductCustomizationStatus(id: number, status: number) {
  return http
    .patch<ApiResponse<ProductCustomization>>(`/product-customizations/${id}/status`, { status })
    .then((res) => res.data)
}

/**
 * 创建客制化项目
 * POST /product-customizations
 */
export function createProductCustomization(data: CreateProductCustomizationRequest) {
  return http
    .post<ApiResponse<ProductCustomization>>("/product-customizations", data)
    .then((res) => res.data)
}

// ──── 客制化选项 ────

/**
 * 获取客制化选项列表
 * GET /product-customizations/:id/options
 */
export function getCustomizationOptions(customizationId: number) {
  return http
    .get<ApiResponse<CustomizationOption[]>>(`/product-customizations/${customizationId}/options`)
    .then((res) => res.data)
}

/**
 * 创建客制化选项
 * POST /product-customizations/:id/options
 */
export function createCustomizationOption(
  customizationId: number,
  data: CreateCustomizationOptionRequest,
) {
  return http
    .post<ApiResponse<CustomizationOption>>(
      `/product-customizations/${customizationId}/options`,
      data,
    )
    .then((res) => res.data)
}

/**
 * 更新客制化选项
 * PUT /product-customizations/:id/options/:optionId
 */
export function updateCustomizationOption(
  customizationId: number,
  optionId: number,
  data: UpdateCustomizationOptionRequest,
) {
  return http
    .put<ApiResponse<CustomizationOption>>(
      `/product-customizations/${customizationId}/options/${optionId}`,
      data,
    )
    .then((res) => res.data)
}

/**
 * 删除客制化选项
 * DELETE /product-customizations/:id/options/:optionId
 */
export function deleteCustomizationOption(customizationId: number, optionId: number) {
  return http
    .delete<ApiResponse<null>>(`/product-customizations/${customizationId}/options/${optionId}`)
    .then((res) => res.data)
}
