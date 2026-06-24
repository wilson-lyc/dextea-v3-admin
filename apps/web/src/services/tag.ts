import type {
  ApiResponse,
  ProductTag,
  CreateTagInput,
  UpdateTagInput,
} from "@dextea/shared-types"
import { http } from "./http"

/** GET /tags — 获取商品标签列表 */
export function getTags() {
  return http.get<ApiResponse<ProductTag[]>>("/tags").then((res) => res.data)
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
