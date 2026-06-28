import type {
  ApiResponse,
  PaginatedData,
  ProductTag,
  CreateTagInput,
  UpdateTagInput,
} from "@dextea/shared-types"
import { http } from "./http"

/**
 * 获取商品标签列表
 * GET /tags
 */
export function getTags(params?: { page?: number; pageSize?: number }) {
  return http.get<ApiResponse<PaginatedData<ProductTag>>>("/tags", { params }).then((res) => res.data)
}

/**
 * 新增标签
 * POST /tags
 */
export function createTag(data: CreateTagInput) {
  return http.post<ApiResponse<ProductTag>>("/tags", data).then((res) => res.data)
}

/**
 * 更新标签信息
 * PUT /tags/:id
 */
export function updateTag(id: number, data: UpdateTagInput) {
  return http.put<ApiResponse<ProductTag>>(`/tags/${id}`, data).then((res) => res.data)
}

/**
 * 删除标签
 * DELETE /tags/:id
 */
export function deleteTag(id: number) {
  return http.delete<ApiResponse<null>>(`/tags/${id}`).then((res) => res.data)
}

// ──── 商品绑定 ────

interface TagBoundProduct {
  id: number
  name: string
}

/**
 * 获取标签绑定的商品列表
 * GET /tags/:id/products
 */
export function getTagBoundProducts(tagId: number, params?: { page?: number; pageSize?: number }) {
  return http.get<ApiResponse<PaginatedData<TagBoundProduct>>>(`/tags/${tagId}/products`, { params }).then((res) => res.data)
}

/**
 * 绑定商品到标签
 * POST /tags/:id/products
 */
export function bindProductToTag(tagId: number, productId: number) {
  return http.post<ApiResponse<null>>(`/tags/${tagId}/products`, { productId }).then((res) => res.data)
}

/**
 * 解绑商品与标签
 * DELETE /tags/:id/products/:productId
 */
export function unbindProductFromTag(tagId: number, productId: number) {
  return http.delete<ApiResponse<null>>(`/tags/${tagId}/products/${productId}`).then((res) => res.data)
}
