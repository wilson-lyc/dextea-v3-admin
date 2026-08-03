import { createModuleClient, type ApiResponse, type PaginatedData } from "./client"
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeProfileRequest,
  CreateEmployeeResponse,
  UpdateEmployeeProfileResponse,
  ToggleEmployeeStatusResponse,
  ResetEmployeePasswordResponse,
  GetEmployeeListRequest,
  EmployeeRolesResponse,
  SetEmployeeRolesRequest,
} from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────
export type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeProfileRequest,
  CreateEmployeeResponse,
  UpdateEmployeeProfileResponse,
  ToggleEmployeeStatusResponse,
  ResetEmployeePasswordResponse,
  EmployeeRolesResponse,
  SetEmployeeRolesRequest,
} from "@dextea-admin/contracts"

const http = createModuleClient("employee")

/**
 * 获取员工列表（分页）
 * GET /employees
 */
export function getEmployees(params?: Partial<GetEmployeeListRequest>) {
  return http
    .get<ApiResponse<PaginatedData<Employee>>>("/employees", { params })
    .then((res) => res.data)
}

/**
 * 创建员工
 * POST /employees
 */
export function createEmployee(data: CreateEmployeeRequest) {
  return http
    .post<ApiResponse<CreateEmployeeResponse>>("/employees", data)
    .then((res) => res.data)
}

/**
 * 更新员工基础信息
 * PUT /employees/:id/profile
 */
export function updateEmployee(id: number, data: UpdateEmployeeProfileRequest) {
  return http
    .put<ApiResponse<UpdateEmployeeProfileResponse>>(`/employees/${id}/profile`, data)
    .then((res) => res.data)
}

/**
 * 启用/禁用员工（指定目标状态）
 * PATCH /employees/:id/status
 */
export function toggleEmployeeStatus(id: number, status: number) {
  return http
    .patch<ApiResponse<ToggleEmployeeStatusResponse>>(`/employees/${id}/status`, { status })
    .then((res) => res.data)
}

/**
 * 重置员工密码
 * POST /employees/:id/reset-password
 */
export function resetEmployeePassword(id: number) {
  return http
    .post<ApiResponse<ResetEmployeePasswordResponse>>(`/employees/${id}/reset-password`)
    .then((res) => res.data)
}

/**
 * 获取员工已绑定的角色
 * GET /employees/:id/roles
 */
export function getEmployeeRoles(id: number) {
  return http
    .get<ApiResponse<EmployeeRolesResponse>>(`/employees/${id}/roles`)
    .then((res) => res.data)
}

/**
 * 设置员工角色（全量覆盖 = 绑定 + 解绑）
 * PUT /employees/:id/roles
 */
export function setEmployeeRoles(id: number, data: SetEmployeeRolesRequest) {
  return http
    .put<ApiResponse<null>>(`/employees/${id}/roles`, data)
    .then((res) => res.data)
}
