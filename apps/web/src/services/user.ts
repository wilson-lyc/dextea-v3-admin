import type { User, UserStatus, ApiResponse, PaginatedData } from '@dextea/shared-types'
import { http } from './http'

export interface CreateUserData {
  email: string
  displayName: string
}

export interface UpdateUserData {
  email: string
  displayName: string
  status: UserStatus
}

export interface CreateUserResult {
  user: User
  initialPassword: string
}

export interface ToggleStatusResult {
  status: UserStatus
}

/** GET /users (paginated) */
export function getUsers(params?: { page?: number; pageSize?: number }) {
  return http
    .get<ApiResponse<PaginatedData<User>>>('/users', { params })
    .then((res) => res.data)
}

/** POST /users */
export function createUser(data: CreateUserData) {
  return http
    .post<ApiResponse<CreateUserResult>>('/users', data)
    .then((res) => res.data)
}

/** PUT /users/:id */
export function updateUser(id: number, data: UpdateUserData) {
  return http
    .put<ApiResponse<{ id: number }>>(`/users/${id}`, data)
    .then((res) => res.data)
}

/** PATCH /users/:id/status — toggle user enabled/disabled */
export function toggleUserStatus(id: number) {
  return http
    .patch<ApiResponse<ToggleStatusResult>>(`/users/${id}/status`)
    .then((res) => res.data)
}
