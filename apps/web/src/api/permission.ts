import { createModuleClient, type ApiResponse, type PaginatedData } from "./client"
import type {
  Permission,
  PermissionListRequest,
  PermissionOptionListResponse,
} from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────
export type {
  Permission,
  PermissionOption,
} from "@dextea-admin/contracts"

const http = createModuleClient("permission")

/**
 * 获取权限列表（分页）
 * GET /permissions
 */
export function getPermissions(params?: Partial<PermissionListRequest>) {
  return http
    .get<ApiResponse<PaginatedData<Permission>>>("/permissions", { params })
    .then((res) => res.data)
}

/**
 * 获取全部权限选项（供角色分配权限时选择使用）
 * GET /permissions/options
 */
export function getPermissionOptions() {
  return http
    .get<ApiResponse<PermissionOptionListResponse>>("/permissions/options")
    .then((res) => res.data)
}
