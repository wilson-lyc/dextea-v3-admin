import type { Product, ProductStatus, ApiResponse, PaginatedData, CreateProductInput, CreateProductResponse } from "@dextea/shared-types"
import { http } from "./http"

/** GET /products (paginated) */
export function getProducts(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return http
    .get<ApiResponse<PaginatedData<Product>>>("/products", { params })
    .then((res) => res.data)
}

/** GET /products/:id */
export function getProduct(id: number) {
  return http.get<ApiResponse<Product>>(`/products/${id}`).then((res) => res.data)
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

/** DELETE /products/:id/tags/:tagId — 从商品移除标签 */
export function removeProductTag(productId: number, tagId: number) {
  return http
    .delete<ApiResponse<null>>(`/products/${productId}/tags/${tagId}`)
    .then((res) => res.data)
}
