import { createModuleClient, type ApiResponse, type PaginatedData } from "./client"
import type { IngredientStatus } from "@dextea-admin/contracts/status"
import type {
  Ingredient,
  CreateIngredientRequest,
  CreateIngredientResponse,
  UpdateIngredientRequest,
  UpdateIngredientResponse,
  IngredientProduct,
  IngredientOption,
  IngredientOptionSelect,
} from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────
export type {
  Ingredient,
  CreateIngredientRequest,
  CreateIngredientResponse,
  UpdateIngredientRequest,
  UpdateIngredientResponse,
} from "@dextea-admin/contracts"

const http = createModuleClient("ingredient")

/**
 * 获取原料列表（分页）
 * GET /ingredients
 */
export function getIngredients(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return http
    .get<ApiResponse<PaginatedData<Ingredient>>>("/ingredients", { params })
    .then((res) => res.data)
}

/**
 * 获取原料详情
 * GET /ingredients/:id/info
 */
export function getIngredient(id: number) {
  return http.get<ApiResponse<Ingredient>>(`/ingredients/${id}/info`).then((res) => res.data)
}

/**
 * 创建原料
 * POST /ingredients
 */
export function createIngredient(data: CreateIngredientRequest) {
  return http
    .post<ApiResponse<CreateIngredientResponse>>("/ingredients", data)
    .then((res) => res.data)
}

/**
 * 更新原料信息
 * PUT /ingredients/:id/info
 */
export function updateIngredient(id: number, data: UpdateIngredientRequest) {
  return http
    .put<ApiResponse<UpdateIngredientResponse>>(`/ingredients/${id}/info`, data)
    .then((res) => res.data)
}

/**
 * 上下架原料
 * PATCH /ingredients/:id/status
 */
export function toggleIngredientStatus(id: number, status: IngredientStatus) {
  return http
    .patch<ApiResponse<Ingredient>>(`/ingredients/${id}/status`, { status })
    .then((res) => res.data)
}

// ──── 商品绑定 ────

/**
 * 获取原料绑定的商品列表
 * GET /ingredients/:id/products
 */
export function getIngredientBoundProducts(
  ingredientId: number,
  params?: { page?: number; pageSize?: number },
) {
  return http
    .get<ApiResponse<PaginatedData<IngredientProduct>>>(`/ingredients/${ingredientId}/products`, {
      params,
    })
    .then((res) => res.data)
}

/**
 * 绑定商品到原料
 * POST /ingredients/:id/products
 */
export function bindProductToIngredient(ingredientId: number, productId: number, quantity: number) {
  return http
    .post<ApiResponse<null>>(`/ingredients/${ingredientId}/products`, { productId, quantity })
    .then((res) => res.data)
}

/**
 * 更新原料绑定商品用量
 * PATCH /ingredients/:id/products/:productId/quantity
 */
export function updateIngredientProductQuantity(
  ingredientId: number,
  productId: number,
  quantity: number,
) {
  return http
    .patch<ApiResponse<null>>(`/ingredients/${ingredientId}/products/${productId}/quantity`, {
      quantity,
    })
    .then((res) => res.data)
}

/**
 * 解绑商品与原料
 * DELETE /ingredients/:id/products/:productId
 */
export function unbindProductFromIngredient(ingredientId: number, productId: number) {
  return http
    .delete<ApiResponse<null>>(`/ingredients/${ingredientId}/products/${productId}`)
    .then((res) => res.data)
}

/**
 * 获取原料选项列表
 * GET /ingredients/options
 */
export function getIngredientOptions() {
  return http
    .get<ApiResponse<IngredientOptionSelect[]>>("/ingredients/options")
    .then((res) => res.data)
}

// ──── 客制化选项绑定 ────

/**
 * 获取原料绑定的客制化选项
 * GET /ingredients/:id/customization-options
 */
export function getIngredientBoundOptions(
  ingredientId: number,
  params?: { page?: number; pageSize?: number },
) {
  return http
    .get<ApiResponse<PaginatedData<IngredientOption>>>(`/ingredients/${ingredientId}/customization-options`, {
      params,
    })
    .then((res) => res.data)
}

/**
 * 绑定客制化选项到原料
 * POST /ingredients/:id/customization-options
 */
export function bindOptionToIngredient(ingredientId: number, optionId: number, quantity: number) {
  return http
    .post<ApiResponse<null>>(`/ingredients/${ingredientId}/customization-options`, {
      optionId,
      quantity,
    })
    .then((res) => res.data)
}

/**
 * 更新原料绑定选项用量
 * PATCH /ingredients/:id/customization-options/:optionId/quantity
 */
export function updateIngredientOptionQuantity(
  ingredientId: number,
  optionId: number,
  quantity: number,
) {
  return http
    .patch<ApiResponse<null>>(`/ingredients/${ingredientId}/customization-options/${optionId}/quantity`, {
      quantity,
    })
    .then((res) => res.data)
}

/**
 * 解绑客制化选项与原料
 * DELETE /ingredients/:id/customization-options/:optionId
 */
export function unbindOptionFromIngredient(ingredientId: number, optionId: number) {
  return http
    .delete<ApiResponse<null>>(`/ingredients/${ingredientId}/customization-options/${optionId}`)
    .then((res) => res.data)
}
