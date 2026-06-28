import type {
  User,
  UserStatus,
  ApiResponse,
  PaginatedData,
  CreateUserInput,
  UpdateUserInput,
  CreateUserResponse,
  UpdateUserResponse,
  ToggleUserStatusResponse,
} from '@dextea/shared-types'
import { http } from './http'

/**
 * 获取用户列表（分页）
 * GET /users
 */
export function getUsers(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return http
    .get<ApiResponse<PaginatedData<User>>>('/users', { params })
    .then((res) => res.data)
}

/**
 * 创建用户
 * POST /users
 */
export function createUser(data: CreateUserInput) {
  return http
    .post<ApiResponse<CreateUserResponse>>('/users', data)
    .then((res) => res.data)
}

/**
 * 更新用户信息
 * PUT /users/:id
 */
export function updateUser(id: number, data: UpdateUserInput) {
  return http
    .put<ApiResponse<UpdateUserResponse>>(`/users/${id}`, data)
    .then((res) => res.data)
}

/**
 * 启用/禁用用户
 * PATCH /users/:id/status
 */
export function toggleUserStatus(id: number) {
  return http
    .patch<ApiResponse<ToggleUserStatusResponse>>(`/users/${id}/status`)
    .then((res) => res.data)
}

// Re-export types used by pages
export type { UserStatus }
