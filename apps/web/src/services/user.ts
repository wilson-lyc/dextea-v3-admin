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

/** GET /users (paginated) */
export function getUsers(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return http
    .get<ApiResponse<PaginatedData<User>>>('/users', { params })
    .then((res) => res.data)
}

/** POST /users */
export function createUser(data: CreateUserInput) {
  return http
    .post<ApiResponse<CreateUserResponse>>('/users', data)
    .then((res) => res.data)
}

/** PUT /users/:id */
export function updateUser(id: number, data: UpdateUserInput) {
  return http
    .put<ApiResponse<UpdateUserResponse>>(`/users/${id}`, data)
    .then((res) => res.data)
}

/** PATCH /users/:id/status — toggle user enabled/disabled */
export function toggleUserStatus(id: number) {
  return http
    .patch<ApiResponse<ToggleUserStatusResponse>>(`/users/${id}/status`)
    .then((res) => res.data)
}

// Re-export types used by pages
export type { UserStatus }
