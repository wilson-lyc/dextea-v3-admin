import type {
  ApiResponse,
  PaginatedData,
  ProductTag,
  CreateTagInput,
  UpdateTagInput,
} from "@dextea/shared-types"
import { http } from "./http"

/** GET /tags — 获取商品标签列表 */
export function getTags(params?: { page?: number; pageSize?: number }) {
  return http.get<ApiResponse<PaginatedData<ProductTag>>>("/tags", { params }).then((res) => res.data)
}

/** POST /tags — 新增标签 */
export function createTag(data: CreateTagInput) {
  return http.post<ApiResponse<ProductTag>>("/tags", data).then((res) => res.data)
}

/** PUT /tags/:id — 更新标签名称 */
export function updateTag(id: number, data: UpdateTagInput) {
  return http.put<ApiResponse<ProductTag>>(`/tags/${id}`, data).then((res) => res.data)
}

/** DELETE /tags/:id — 删除标签 */
export function deleteTag(id: number) {
  return http.delete<ApiResponse<null>>(`/tags/${id}`).then((res) => res.data)
}

// ──── 商品绑定 ────

interface TagBoundProduct {
  id: number
  name: string
}

/** GET /tags/:id/products — 获取标签绑定的商品列表 */
export function getTagBoundProducts(tagId: number, params?: { page?: number; pageSize?: number }) {
  return http.get<ApiResponse<PaginatedData<TagBoundProduct>>>(`/tags/${tagId}/products`, { params }).then((res) => res.data)
}

/** POST /tags/:id/products — 绑定商品到标签 */
export function bindProductToTag(tagId: number, productId: number) {
  return http.post<ApiResponse<null>>(`/tags/${tagId}/products`, { productId }).then((res) => res.data)
}

/** DELETE /tags/:id/products/:productId — 解绑商品标签 */
export function unbindProductFromTag(tagId: number, productId: number) {
  return http.delete<ApiResponse<null>>(`/tags/${tagId}/products/${productId}`).then((res) => res.data)
}
