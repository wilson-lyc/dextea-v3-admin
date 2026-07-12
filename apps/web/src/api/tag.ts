import { createModuleClient, type ApiResponse, type PaginatedData } from "./client"
import type { CreateTagRequest, UpdateTagRequest, TagProductItem } from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────

// 标签实体（create/update 仅返回 {id, name}，故字段按需可选）
export interface ProductTag {
  id: number
  name: string
  boundCount?: number
  createdAt?: string
  updatedAt?: string
}

export type CreateTagInput = CreateTagRequest
export type UpdateTagInput = UpdateTagRequest

const http = createModuleClient("tag")

/**
 * 获取商品标签列表
 * GET /tags
 */
export function getTags(params?: { page?: number; pageSize?: number }) {
  return http
    .get<ApiResponse<PaginatedData<ProductTag>>>("/tags", { params })
    .then((res) => res.data)
}

/**
 * 新增标签
 * POST /tags
 */
export function createTag(data: CreateTagRequest) {
  return http.post<ApiResponse<ProductTag>>("/tags", data).then((res) => res.data)
}

/**
 * 更新标签信息
 * PUT /tags/:id/info
 */
export function updateTag(id: number, data: UpdateTagRequest) {
  return http.put<ApiResponse<ProductTag>>(`/tags/${id}/info`, data).then((res) => res.data)
}

/**
 * 删除标签
 * DELETE /tags/:id/info
 */
export function deleteTag(id: number) {
  return http.delete<ApiResponse<null>>(`/tags/${id}/info`).then((res) => res.data)
}

// ──── 商品绑定 ────

/**
 * 获取标签绑定的商品列表
 * GET /tags/:id/products
 */
export function getTagBoundProducts(tagId: number, params?: { page?: number; pageSize?: number }) {
  return http
    .get<ApiResponse<PaginatedData<TagProductItem>>>(`/tags/${tagId}/products`, { params })
    .then((res) => res.data)
}

/**
 * 绑定商品到标签（单次绑定一个商品）
 * POST /tags/:id/products
 */
export function bindProductToTag(tagId: number, productId: number) {
  return http
    .post<ApiResponse<null>>(`/tags/${tagId}/products`, { productIds: [productId] })
    .then((res) => res.data)
}

/**
 * 解绑商品与标签（单次解绑一个商品）
 * DELETE /tags/:id/products
 */
export function unbindProductFromTag(tagId: number, productId: number) {
  return http
    .delete<ApiResponse<null>>(`/tags/${tagId}/products`, { data: { productIds: [productId] } })
    .then((res) => res.data)
}

/**
 * 获取标签选项列表
 * GET /tags/options
 */
export function getTagOptions() {
  return http
    .get<ApiResponse<Array<{ label: string; value: string }>>>("/tags/options")
    .then((res) => res.data)
}
