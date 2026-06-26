// ====== 原料 ======
// ──────────────────────────────

import type { IngredientStatus } from '../status/ingredient.js';

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  status: IngredientStatus;
  boundCount: number;
  optionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIngredientInput {
  name: string;
  unit: string;
  status?: IngredientStatus;
}

export interface CreateIngredientResponse {
  id: number;
}

export interface UpdateIngredientInput {
  name?: string;
  unit?: string;
  status?: IngredientStatus;
}

export interface UpdateIngredientResponse {
  id: number;
}

export interface IngredientQuery {
  page?: string;
  pageSize?: string;
  keyword?: string;
}
