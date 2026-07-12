import { createModuleClient, type ApiResponse, type PaginatedData } from "./client"
import type { ProductStatus } from "@dextea-admin/contracts/status"
import type {
  Product,
  CreateProductRequest,
  CreateProductResponse,
  IngredientRelation,
  ProductOption,
  UpdateProductRequest,
  TagSimple,
} from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────
export type {
  Product,
  CreateProductRequest,
  CreateProductResponse,
  IngredientRelation,
  ProductOption,
  UpdateProductRequest,
  TagSimple,
} from "@dextea-admin/contracts"

const http = createModuleClient("product")

/**
 * 获取商品列表（分页）
 * GET /products
 */
export function getProducts(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: number
  priceMin?: number
  priceMax?: number
  tagIds?: string
}) {
  return http
    .get<ApiResponse<PaginatedData<Product>>>("/products", { params })
    .then((res) => res.data)
}

/**
 * 获取商品基本信息
 * GET /products/:id/basic-info
 */
export function getProductBasicInfo(id: number) {
  return http.get<ApiResponse<Product>>(`/products/${id}/basic-info`).then((res) => res.data)
}

/**
 * 创建商品
 * POST /products
 */
export function createProduct(data: CreateProductRequest) {
  return http.post<ApiResponse<CreateProductResponse>>("/products", data).then((res) => res.data)
}

/**
 * 更新商品信息
 * PUT /products/:id
 */
export function updateProduct(id: string, data: UpdateProductRequest) {
  return http.put<ApiResponse<Product>>(`/products/${id}`, data).then((res) => res.data)
}

/**
 * 上下架商品
 * PUT /products/:id/status
 */
export function toggleProductStatus(id: string, status: ProductStatus) {
  return http
    .put<ApiResponse<Product>>(`/products/${id}/status`, { status })
    .then((res) => res.data)
}

/**
 * 添加标签到商品（单次绑定一个标签）
 * POST /products/:id/tags
 */
export function addProductTag(productId: number, tagId: number) {
  return http
    .post<ApiResponse<null>>(`/products/${productId}/tags`, { tagIds: [tagId] })
    .then((res) => res.data)
}

/**
 * 获取商品标签列表（分页）
 * GET /products/:id/tags
 */
export function getProductTags(productId: number, params?: { page?: number; pageSize?: number }) {
  return http
    .get<ApiResponse<PaginatedData<TagSimple>>>(`/products/${productId}/tags`, { params })
    .then((res) => res.data)
}

/**
 * 从商品移除标签（单次解绑一个标签）
 * DELETE /products/:id/tags
 */
export function removeProductTag(productId: number, tagId: number) {
  return http
    .delete<ApiResponse<null>>(`/products/${productId}/tags`, { data: { tagIds: [tagId] } })
    .then((res) => res.data)
}

/**
 * 获取商品绑定的原料列表
 * GET /products/:id/ingredients
 */
export function getProductBoundIngredients(
  productId: number,
  params?: { page?: number; pageSize?: number },
) {
  return http
    .get<ApiResponse<PaginatedData<IngredientRelation>>>(`/products/${productId}/ingredients`, {
      params,
    })
    .then((res) => res.data)
}

/**
 * 绑定原料到商品
 * POST /products/:id/ingredients
 */
export function bindIngredientToProduct(productId: number, ingredientId: number, quantity: number) {
  return http
    .post<ApiResponse<null>>(`/products/${productId}/ingredients`, { ingredientId, quantity })
    .then((res) => res.data)
}

/**
 * 更新原料绑定用量
 * PATCH /products/:id/ingredients/:ingredientId/quantity
 */
export function updateProductIngredientQuantity(
  productId: number,
  ingredientId: number,
  quantity: number,
) {
  return http
    .patch<ApiResponse<null>>(`/products/${productId}/ingredients/${ingredientId}/quantity`, {
      quantity,
    })
    .then((res) => res.data)
}

/**
 * 从商品移除原料
 * DELETE /products/:id/ingredients/:ingredientId
 */
export function unbindIngredientFromProduct(productId: number, ingredientId: number) {
  return http
    .delete<ApiResponse<null>>(`/products/${productId}/ingredients/${ingredientId}`)
    .then((res) => res.data)
}

/**
 * 获取商品选项列表
 * GET /products/options
 */
export function getProductOptions() {
  return http.get<ApiResponse<ProductOption[]>>("/products/options").then((res) => res.data)
}
