import { createModuleClient, type ApiResponse, type PaginatedData } from "./client"
import type { EmployeeStatus } from "@/lib/status"

// ──── DTO ────
export interface Employee {
  id: number
  email: string
  displayName: string
  status: EmployeeStatus
  createdAt: string
  updatedAt: string
}

export interface CreateEmployeeRequest {
  email: string
  displayName: string
}

export interface UpdateEmployeeRequest {
  email: string
  displayName: string
}

export interface CreateEmployeeResponse {
  user: {
    id: number
    email: string
    displayName: string
    status: EmployeeStatus
  }
  initialPassword: string
}

export interface UpdateEmployeeResponse {
  id: number
  email: string
  displayName: string
}

export interface ToggleEmployeeStatusResponse {
  email: string
  status: EmployeeStatus
}

const http = createModuleClient("employee")

/**
 * 获取员工列表（分页）
 * GET /employees
 */
export function getEmployees(params?: { page?: number; pageSize?: number; keyword?: string }) {
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
 * PUT /employees/:id
 */
export function updateEmployee(id: number, data: UpdateEmployeeRequest) {
  return http
    .put<ApiResponse<UpdateEmployeeResponse>>(`/employees/${id}`, data)
    .then((res) => res.data)
}

/**
 * 启用/禁用员工
 * PATCH /employees/:id/status
 */
export function toggleEmployeeStatus(id: number) {
  return http
    .put<ApiResponse<ToggleEmployeeStatusResponse>>(`/employees/${id}/status`)
    .then((res) => res.data)
}
