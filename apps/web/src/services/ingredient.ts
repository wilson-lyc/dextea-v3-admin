import type { Ingredient, IngredientStatus, ApiResponse, PaginatedData, CreateIngredientInput, CreateIngredientResponse, UpdateIngredientInput, UpdateIngredientResponse } from "@dextea/shared-types"
import { http } from "./http"

interface BoundProduct {
  productId: number
  productName: string
  quantity: number
}

/** GET /ingredients (paginated) */
export function getIngredients(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return http
    .get<ApiResponse<PaginatedData<Ingredient>>>("/ingredients", { params })
    .then((res) => res.data)
}

/** GET /ingredients/:id */
export function getIngredient(id: number) {
  return http.get<ApiResponse<Ingredient>>(`/ingredients/${id}`).then((res) => res.data)
}

/** POST /ingredients */
export function createIngredient(data: CreateIngredientInput) {
  return http.post<ApiResponse<CreateIngredientResponse>>("/ingredients", data).then((res) => res.data)
}

/** PUT /ingredients/:id */
export function updateIngredient(id: number, data: UpdateIngredientInput) {
  return http.put<ApiResponse<UpdateIngredientResponse>>(`/ingredients/${id}`, data).then((res) => res.data)
}

/** PATCH /ingredients/:id/status — 上下架 */
export function toggleIngredientStatus(id: number, status: IngredientStatus) {
  return http
    .patch<ApiResponse<Ingredient>>(`/ingredients/${id}/status`, { status })
    .then((res) => res.data)
}

// ──── 商品绑定 ────

/** GET /ingredients/:id/products */
export function getIngredientBoundProducts(ingredientId: number, params?: { page?: number; pageSize?: number }) {
  return http.get<ApiResponse<PaginatedData<BoundProduct>>>(`/ingredients/${ingredientId}/products`, { params }).then((res) => res.data)
}

/** POST /ingredients/:id/products */
export function bindProductToIngredient(ingredientId: number, productId: number, quantity: number) {
  return http.post<ApiResponse<null>>(`/ingredients/${ingredientId}/products`, { productId, quantity }).then((res) => res.data)
}

/** PATCH /ingredients/:id/products/:productId/quantity */
export function updateIngredientProductQuantity(ingredientId: number, productId: number, quantity: number) {
  return http.patch<ApiResponse<null>>(`/ingredients/${ingredientId}/products/${productId}/quantity`, { quantity }).then((res) => res.data)
}

/** DELETE /ingredients/:id/products/:productId */
export function unbindProductFromIngredient(ingredientId: number, productId: number) {
  return http.delete<ApiResponse<null>>(`/ingredients/${ingredientId}/products/${productId}`).then((res) => res.data)
}

interface IngredientOption {
  label: string
  value: string
  unit: string
}

/** GET /ingredients/options */
export function getIngredientOptions() {
  return http.get<ApiResponse<IngredientOption[]>>("/ingredients/options").then((res) => res.data)
}

// ──── 客制化选项绑定 ────

interface BoundOption {
  optionId: number
  optionName: string
  customizationName: string
  quantity: number
}

/** GET /customization-options/options */
/** GET /ingredients/:id/customization-options */
export function getIngredientBoundOptions(ingredientId: number, params?: { page?: number; pageSize?: number }) {
  return http.get<ApiResponse<PaginatedData<BoundOption>>>(`/ingredients/${ingredientId}/customization-options`, { params }).then((res) => res.data)
}

/** POST /ingredients/:id/customization-options */
export function bindOptionToIngredient(ingredientId: number, optionId: number, quantity: number) {
  return http.post<ApiResponse<null>>(`/ingredients/${ingredientId}/customization-options`, { optionId, quantity }).then((res) => res.data)
}

/** PATCH /ingredients/:id/customization-options/:optionId/quantity */
export function updateIngredientOptionQuantity(ingredientId: number, optionId: number, quantity: number) {
  return http.patch<ApiResponse<null>>(`/ingredients/${ingredientId}/customization-options/${optionId}/quantity`, { quantity }).then((res) => res.data)
}

/** DELETE /ingredients/:id/customization-options/:optionId */
export function unbindOptionFromIngredient(ingredientId: number, optionId: number) {
  return http.delete<ApiResponse<null>>(`/ingredients/${ingredientId}/customization-options/${optionId}`).then((res) => res.data)
}
