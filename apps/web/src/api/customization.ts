import {
  createModuleClient,
  type ApiResponse,
  type PaginatedData,
} from "./client"
import type { CustomizationStatus, CustomizationOptionStatus } from "@/lib/status"

// ──── DTO ────
export interface Customization {
  id: number
  productId: number
  name: string
  status: CustomizationStatus
  optionCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateCustomizationRequest {
  productId: number
  name: string
}

export interface UpdateCustomizationRequest {
  name: string
  status?: CustomizationStatus
}

export interface CustomizationOption {
  id: number
  customizationId: number
  name: string
  price: number
  sort: number
  status: CustomizationOptionStatus
  ingredientId: number | null
  ingredientName: string | null
  quantity: number
  createdAt: string
  updatedAt: string
}

export interface CreateCustomizationOptionRequest {
  name: string
  price?: number
  sort?: number
  ingredientId?: number | null
  quantity?: number
}

export interface UpdateCustomizationOptionRequest {
  name?: string
  price?: number
  sort?: number
  status?: CustomizationOptionStatus
  ingredientId?: number | null
  quantity?: number
}

const http = createModuleClient("customization")

/**
 * 获取客制化项目列表（分页）
 * GET /customizations
 */
export function getCustomizations(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: number
  productId?: number
}) {
  return http
    .get<ApiResponse<PaginatedData<Customization>>>("/customizations", { params })
    .then((res) => res.data)
}

/**
 * 获取客制化项目详情
 * GET /customizations/:id
 */
export function getCustomization(id: number) {
  return http
    .get<ApiResponse<Customization>>(`/customizations/${id}`)
    .then((res) => res.data)
}

/**
 * 更新客制化项目
 * PATCH /customizations/:id
 */
export function updateCustomization(id: number, data: UpdateCustomizationRequest) {
  return http
    .patch<ApiResponse<Customization>>(`/customizations/${id}`, data)
    .then((res) => res.data)
}

/**
 * 单独更新客制化项目状态
 * PATCH /customizations/:id/status
 */
export function updateCustomizationStatus(id: number, status: number) {
  return http
    .patch<ApiResponse<Customization>>(`/customizations/${id}/status`, { status })
    .then((res) => res.data)
}

/**
 * 创建客制化项目
 * POST /customizations
 */
export function createCustomization(data: CreateCustomizationRequest) {
  return http
    .post<ApiResponse<Customization>>("/customizations", data)
    .then((res) => res.data)
}

// ──── 客制化选项 ────

/**
 * 获取客制化选项列表
 * GET /customizations/:id/options
 */
export function getCustomizationOptions(customizationId: number) {
  return http
    .get<ApiResponse<CustomizationOption[]>>(`/customizations/${customizationId}/options`)
    .then((res) => res.data)
}

/**
 * 创建客制化选项
 * POST /customizations/:id/options
 */
export function createCustomizationOption(
  customizationId: number,
  data: CreateCustomizationOptionRequest,
) {
  return http
    .post<ApiResponse<CustomizationOption>>(
      `/customizations/${customizationId}/options`,
      data,
    )
    .then((res) => res.data)
}

/**
 * 更新客制化选项
 * PUT /customizations/:id/options/:optionId
 */
export function updateCustomizationOption(
  customizationId: number,
  optionId: number,
  data: UpdateCustomizationOptionRequest,
) {
  return http
    .put<ApiResponse<CustomizationOption>>(
      `/customizations/${customizationId}/options/${optionId}`,
      data,
    )
    .then((res) => res.data)
}

/**
 * 删除客制化选项
 * DELETE /customizations/:id/options/:optionId
 */
export function deleteCustomizationOption(customizationId: number, optionId: number) {
  return http
    .delete<ApiResponse<null>>(`/customizations/${customizationId}/options/${optionId}`)
    .then((res) => res.data)
}
