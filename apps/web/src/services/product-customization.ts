import type { ApiResponse, PaginatedData, ProductCustomization, CreateProductCustomizationInput } from "@dextea/shared-types"
import { http } from "./http"

/** GET /product-customizations */
export function getProductCustomizations(params?: { page?: number; pageSize?: number }) {
  return http.get<ApiResponse<PaginatedData<ProductCustomization>>>("/product-customizations", { params }).then((res) => res.data)
}

/** GET /product-customizations/:id */
export function getProductCustomization(id: number) {
  return http.get<ApiResponse<ProductCustomization>>(`/product-customizations/${id}`).then((res) => res.data)
}

/** POST /product-customizations */
export function createProductCustomization(data: CreateProductCustomizationInput) {
  return http.post<ApiResponse<ProductCustomization>>("/product-customizations", data).then((res) => res.data)
}

interface BoundProduct {
  productId: number
  productName: string
}

/** GET /product-customizations/:id/products */
export function getBoundProducts(customizationId: number) {
  return http.get<ApiResponse<BoundProduct[]>>(`/product-customizations/${customizationId}/products`).then((res) => res.data)
}

/** POST /product-customizations/:id/products */
export function bindProduct(customizationId: number, productId: number) {
  return http.post<ApiResponse<null>>(`/product-customizations/${customizationId}/products`, { productId }).then((res) => res.data)
}

/** DELETE /product-customizations/:id/products/:productId */
export function unbindProduct(customizationId: number, productId: number) {
  return http.delete<ApiResponse<null>>(`/product-customizations/${customizationId}/products/${productId}`).then((res) => res.data)
}
