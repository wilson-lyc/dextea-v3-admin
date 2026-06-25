import type { Product, ProductTag, ProductStatus, ApiResponse, PaginatedData, CreateProductInput, CreateProductResponse } from "@dextea/shared-types"
import { http } from "./http"

/** GET /products (paginated) */
export function getProducts(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return http
    .get<ApiResponse<PaginatedData<Product>>>("/products", { params })
    .then((res) => res.data)
}

/** GET /products/:id/basic-info */
export function getProductBasicInfo(id: number) {
  return http.get<ApiResponse<Product>>(`/products/${id}/basic-info`).then((res) => res.data)
}

/** POST /products */
export function createProduct(data: CreateProductInput) {
  return http.post<ApiResponse<CreateProductResponse>>("/products", data).then((res) => res.data)
}

/** PUT /products/:id */
export function updateProduct(id: string, data: Partial<Product>) {
  return http.put<ApiResponse<Product>>(`/products/${id}`, data).then((res) => res.data)
}

/** PATCH /products/:id/status — 上下架 */
export function toggleProductStatus(id: string, status: ProductStatus) {
  return http
    .patch<ApiResponse<Product>>(`/products/${id}/status`, { status })
    .then((res) => res.data)
}

/** POST /products/:id/tags — 添加标签到商品 */
export function addProductTag(productId: number, tagId: number) {
  return http
    .post<ApiResponse<null>>(`/products/${productId}/tags`, { tagId })
    .then((res) => res.data)
}

/** GET /products/:id/tags — 获取商品标签 */
export function getProductTags(productId: number) {
  return http.get<ApiResponse<ProductTag[]>>(`/products/${productId}/tags`).then((res) => res.data)
}

/** DELETE /products/:id/tags/:tagId — 从商品移除标签 */
export function removeProductTag(productId: number, tagId: number) {
  return http
    .delete<ApiResponse<null>>(`/products/${productId}/tags/${tagId}`)
    .then((res) => res.data)
}

interface BoundCustomization {
  customizationId: number
  customizationName: string
  sort: number
}

/** GET /products/:id/customizations — 获取商品绑定的客制化项目 */
export function getBoundCustomizations(productId: number) {
  return http.get<ApiResponse<BoundCustomization[]>>(`/products/${productId}/customizations`).then((res) => res.data)
}

/** POST /products/:id/customizations — 绑定客制化项目到商品 */
export function addProductCustomization(productId: number, customizationId: number, sort?: number) {
  return http
    .post<ApiResponse<null>>(`/products/${productId}/customizations`, { customizationId, sort })
    .then((res) => res.data)
}

/** PATCH /products/:id/customizations/:customizationId/sort — 更新客制化项目绑定排序 */
export function updateProductCustomizationSort(productId: number, customizationId: number, sort: number) {
  return http
    .patch<ApiResponse<null>>(`/products/${productId}/customizations/${customizationId}/sort`, { sort })
    .then((res) => res.data)
}

/** DELETE /products/:id/customizations/:customizationId — 从商品移除客制化项目 */
export function removeProductCustomization(productId: number, customizationId: number) {
  return http
    .delete<ApiResponse<null>>(`/products/${productId}/customizations/${customizationId}`)
    .then((res) => res.data)
}
