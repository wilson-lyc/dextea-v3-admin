import type { ApiResponse, PaginatedData, ProductCustomization, CreateProductCustomizationInput, UpdateProductCustomizationInput, CustomizationOption, CreateCustomizationOptionInput, UpdateCustomizationOptionInput } from "@dextea/shared-types"
import { http } from "./http"

/**
 * 获取客制化项目列表（分页）
 * GET /product-customizations
 */
export function getProductCustomizations(params?: { page?: number; pageSize?: number; keyword?: string; status?: number }) {
  return http.get<ApiResponse<PaginatedData<ProductCustomization>>>("/product-customizations", { params }).then((res) => res.data)
}

/**
 * 获取客制化项目详情
 * GET /product-customizations/:id
 */
export function getProductCustomization(id: number) {
  return http.get<ApiResponse<ProductCustomization>>(`/product-customizations/${id}`).then((res) => res.data)
}

/**
 * 更新客制化项目
 * PATCH /product-customizations/:id
 */
export function updateProductCustomization(id: number, data: UpdateProductCustomizationInput) {
  return http.patch<ApiResponse<ProductCustomization>>(`/product-customizations/${id}`, data).then((res) => res.data)
}

/**
 * 创建客制化项目
 * POST /product-customizations
 */
export function createProductCustomization(data: CreateProductCustomizationInput) {
  return http.post<ApiResponse<ProductCustomization>>("/product-customizations", data).then((res) => res.data)
}

interface BoundProduct {
  productId: number
  productName: string
  sort: number
}

/**
 * 获取客制化项目绑定的商品列表
 * GET /product-customizations/:id/products
 */
export function getBoundProducts(customizationId: number) {
  return http.get<ApiResponse<BoundProduct[]>>(`/product-customizations/${customizationId}/products`).then((res) => res.data)
}

/**
 * 绑定商品到客制化项目
 * POST /product-customizations/:id/products
 */
export function bindProduct(customizationId: number, productId: number, sort?: number) {
  return http.post<ApiResponse<null>>(`/product-customizations/${customizationId}/products`, { productId, sort }).then((res) => res.data)
}

/**
 * 更新客制化项目绑定的商品排序
 * PATCH /product-customizations/:id/products/:productId/sort
 */
export function updateBoundProductSort(customizationId: number, productId: number, sort: number) {
  return http.patch<ApiResponse<null>>(`/product-customizations/${customizationId}/products/${productId}/sort`, { sort }).then((res) => res.data)
}

/**
 * 解绑商品与客制化项目
 * DELETE /product-customizations/:id/products/:productId
 */
export function unbindProduct(customizationId: number, productId: number) {
  return http.delete<ApiResponse<null>>(`/product-customizations/${customizationId}/products/${productId}`).then((res) => res.data)
}

// ──── 客制化选项 ────

/**
 * 获取客制化选项列表
 * GET /product-customizations/:id/options
 */
export function getCustomizationOptions(customizationId: number) {
  return http.get<ApiResponse<CustomizationOption[]>>(`/product-customizations/${customizationId}/options`).then((res) => res.data)
}

/**
 * 创建客制化选项
 * POST /product-customizations/:id/options
 */
export function createCustomizationOption(customizationId: number, data: CreateCustomizationOptionInput) {
  return http.post<ApiResponse<CustomizationOption>>(`/product-customizations/${customizationId}/options`, data).then((res) => res.data)
}

/**
 * 更新客制化选项
 * PUT /product-customizations/:id/options/:optionId
 */
export function updateCustomizationOption(customizationId: number, optionId: number, data: UpdateCustomizationOptionInput) {
  return http.put<ApiResponse<CustomizationOption>>(`/product-customizations/${customizationId}/options/${optionId}`, data).then((res) => res.data)
}

/**
 * 删除客制化选项
 * DELETE /product-customizations/:id/options/:optionId
 */
export function deleteCustomizationOption(customizationId: number, optionId: number) {
  return http.delete<ApiResponse<null>>(`/product-customizations/${customizationId}/options/${optionId}`).then((res) => res.data)
}
