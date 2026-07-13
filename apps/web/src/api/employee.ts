import { createModuleClient, type ApiResponse, type PaginatedData } from "./client"
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  CreateEmployeeResponse,
  UpdateEmployeeResponse,
  ToggleEmployeeStatusResponse,
  ResetEmployeePasswordResponse,
  GetEmployeeListRequest,
} from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────
export type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  CreateEmployeeResponse,
  UpdateEmployeeResponse,
  ToggleEmployeeStatusResponse,
  ResetEmployeePasswordResponse,
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
 * 更新员工信息
 * PUT /employees/:id/info
 */
export function updateEmployee(id: number, data: UpdateEmployeeRequest) {
  return http
    .put<ApiResponse<UpdateEmployeeResponse>>(`/employees/${id}/info`, data)
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
