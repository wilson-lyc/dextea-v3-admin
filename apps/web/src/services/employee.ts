import type {
  Employee,
  EmployeeStatus,
  ApiResponse,
  PaginatedData,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateEmployeeResponse,
  UpdateEmployeeResponse,
  ToggleEmployeeStatusResponse,
} from '@dextea/shared-types'
import { http } from './http'

/**
 * 获取员工列表（分页）
 * GET /employees
 */
export function getEmployees(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return http
    .get<ApiResponse<PaginatedData<Employee>>>('/employees', { params })
    .then((res) => res.data)
}

/**
 * 创建员工
 * POST /employees
 */
export function createEmployee(data: CreateEmployeeInput) {
  return http
    .post<ApiResponse<CreateEmployeeResponse>>('/employees', data)
    .then((res) => res.data)
}

/**
 * 更新员工信息
 * PUT /employees/:id
 */
export function updateEmployee(id: number, data: UpdateEmployeeInput) {
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

// Re-export types used by pages
export type { EmployeeStatus }
