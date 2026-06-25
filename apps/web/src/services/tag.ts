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
