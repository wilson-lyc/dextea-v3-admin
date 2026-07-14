import { createModuleClient, type ApiResponse, type PaginatedData } from "./client"
import type {
  Role,
  RoleListRequest,
  CreateRoleRequest,
  CreateRoleResponse,
  UpdateRoleRequest,
  UpdateRoleResponse,
  ToggleRoleStatusResponse,
  RoleOptionListResponse,
  RolePermissionsResponse,
  SetRolePermissionsRequest,
} from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────
export type {
  Role,
  RoleOption,
  CreateRoleRequest,
  UpdateRoleRequest,
  RolePermissionsResponse,
} from "@dextea-admin/contracts"

const http = createModuleClient("role")

/**
 * 获取角色列表（分页）
 * GET /roles
 */
export function getRoles(params?: Partial<RoleListRequest>) {
  return http
    .get<ApiResponse<PaginatedData<Role>>>("/roles", { params })
    .then((res) => res.data)
}

/**
 * 获取启用状态的角色选项
 * GET /roles/options
 */
export function getRoleOptions() {
  return http
    .get<ApiResponse<RoleOptionListResponse>>("/roles/options")
    .then((res) => res.data)
}

/**
 * 创建角色
 * POST /roles
 */
export function createRole(data: CreateRoleRequest) {
  return http
    .post<ApiResponse<CreateRoleResponse>>("/roles", data)
    .then((res) => res.data)
}

/**
 * 更新角色
 * PUT /roles/:id/info
 */
export function updateRole(id: number, data: UpdateRoleRequest) {
  return http
    .put<ApiResponse<UpdateRoleResponse>>(`/roles/${id}/info`, data)
    .then((res) => res.data)
}

/**
 * 启用/禁用角色（指定目标状态）
 * PATCH /roles/:id/status
 */
export function toggleRoleStatus(id: number, status: number) {
  return http
    .patch<ApiResponse<ToggleRoleStatusResponse>>(`/roles/${id}/status`, { status })
    .then((res) => res.data)
}

/**
 * 删除角色
 * DELETE /roles/:id/info
 */
export function deleteRole(id: number) {
  return http
    .delete<ApiResponse<null>>(`/roles/${id}/info`)
    .then((res) => res.data)
}

/**
 * 获取角色已绑定的权限
 * GET /roles/:id/permissions
 */
export function getRolePermissions(id: number) {
  return http
    .get<ApiResponse<RolePermissionsResponse>>(`/roles/${id}/permissions`)
    .then((res) => res.data)
}

/**
 * 设置角色权限（全量覆盖 = 绑定 + 解绑）
 * PUT /roles/:id/permissions
 */
export function setRolePermissions(id: number, data: SetRolePermissionsRequest) {
  return http
    .put<ApiResponse<null>>(`/roles/${id}/permissions`, data)
    .then((res) => res.data)
}
