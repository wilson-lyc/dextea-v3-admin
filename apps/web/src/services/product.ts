import type { Product, ProductStatus, ApiResponse, PaginatedData } from "@dextea/shared-types"
import { http } from "./http"

/** GET /products (paginated) */
export function getProducts(params?: { page?: number; pageSize?: number; keyword?: string }) {
  // TODO: 对接商品列表 API
  return http
    .get<ApiResponse<PaginatedData<Product>>>("/products", { params })
    .then((res) => res.data)
}

/** POST /products */
export function createProduct(data: Partial<Product>) {
  // TODO: 对接创建商品 API
  return http.post<ApiResponse<Product>>("/products", data).then((res) => res.data)
}

/** PUT /products/:id */
export function updateProduct(id: string, data: Partial<Product>) {
  // TODO: 对接更新商品 API
  return http.put<ApiResponse<Product>>(`/products/${id}`, data).then((res) => res.data)
}

/** PATCH /products/:id/status — 上下架 */
export function toggleProductStatus(id: string, status: ProductStatus) {
  // TODO: 对接商品上下架 API
  return http
    .patch<ApiResponse<Product>>(`/products/${id}/status`, { status })
    .then((res) => res.data)
}
