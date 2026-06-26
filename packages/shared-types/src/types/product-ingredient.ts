// ====== 商品-原料关联 ======
// ──────────────────────────────

import type { Ingredient } from './ingredient.js';

export interface ProductIngredientRelation {
  ingredientId: number;
  quantity: number;
  ingredient?: Ingredient;
}

export interface BindProductIngredientsInput {
  ingredients: Array<{
    ingredientId: number;
    quantity: number;
  }>;
}
