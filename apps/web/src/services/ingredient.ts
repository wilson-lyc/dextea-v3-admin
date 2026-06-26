import type { Ingredient, IngredientStatus, ApiResponse, PaginatedData, CreateIngredientInput, CreateIngredientResponse, UpdateIngredientInput, UpdateIngredientResponse } from "@dextea/shared-types"
import { http } from "./http"

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
