import { BizError } from '@/common/exceptions/index.js';
import { IngredientErrorCodes } from './ingredient.errorcode.js';
import { ingredientRpcRepository as ingredientRepository } from '@/infrastructure/product/rpc-repositories.js';
import { INGREDIENT_STATUS_VALUES } from '@dextea-admin/contracts';
import type {
  IngredientListRequest,
  CreateIngredientRequest,
  UpdateIngredientRequest,
  UpdateIngredientStatusRequest,
} from '@dextea-admin/contracts';

export const ingredientService = {
  // ──── 原料基础 CRUD ────

  async getIngredientList(params: IngredientListRequest) {
    return ingredientRepository.getIngredientList(params.page, params.pageSize, params.keyword);
  },

  async getIngredientById(id: number) {
    const ingredient = await ingredientRepository.getIngredientById(id);
    if (!ingredient) {
      throw new BizError(IngredientErrorCodes.INGREDIENT_NOT_FOUND);
    }
    return ingredient;
  },

  async createIngredient(input: CreateIngredientRequest) {
    const { name, unit, status } = input;

    if (status !== undefined && !INGREDIENT_STATUS_VALUES.includes(status as 0 | 1)) {
      throw new BizError(IngredientErrorCodes.INVALID_STATUS);
    }

    const id = await ingredientRepository.createIngredient({
      name,
      unit,
      status: status ?? 0,
    });

    return { id };
  },

  async updateIngredient(id: number, input: UpdateIngredientRequest) {
    const { name, unit, status } = input;

    const ingredient = await ingredientRepository.getIngredientById(id);
    if (!ingredient) {
      throw new BizError(IngredientErrorCodes.INGREDIENT_NOT_FOUND);
    }

    if (status !== undefined && !INGREDIENT_STATUS_VALUES.includes(status as 0 | 1)) {
      throw new BizError(IngredientErrorCodes.INVALID_STATUS);
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (unit !== undefined) updateData.unit = unit;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length > 0) {
      await ingredientRepository.updateIngredient(id, updateData);
    }

    return { id };
  },

  async updateIngredientStatus(id: number, input: UpdateIngredientStatusRequest) {
    const { status } = input;

    if (!INGREDIENT_STATUS_VALUES.includes(status as 0 | 1)) {
      throw new BizError(IngredientErrorCodes.INVALID_STATUS);
    }

    const ingredient = await ingredientRepository.getIngredientById(id);
    if (!ingredient) {
      throw new BizError(IngredientErrorCodes.INGREDIENT_NOT_FOUND);
    }

    await ingredientRepository.updateIngredient(id, { status });

    return (await ingredientRepository.getIngredientById(id))!;
  },

  // ──── 绑定商品（只读查询） ────

  async getIngredientProductList(ingredientId: number, page: number, pageSize: number) {
    const ingredient = await ingredientRepository.getIngredientById(ingredientId);
    if (!ingredient) {
      throw new BizError(IngredientErrorCodes.INGREDIENT_NOT_FOUND);
    }

    return ingredientRepository.getIngredientProductList(ingredientId, page, pageSize);
  },

  // ──── 客制化选项绑定 ────

  async getIngredientOptionList(ingredientId: number, page: number, pageSize: number) {
    const ingredient = await ingredientRepository.getIngredientById(ingredientId);
    if (!ingredient) {
      throw new BizError(IngredientErrorCodes.INGREDIENT_NOT_FOUND);
    }

    return ingredientRepository.getIngredientOptionList(ingredientId, page, pageSize);
  },

  // 原料侧仅保留客制化选项绑定的只读查询；绑定 / 更新用量 / 解绑能力
  // 已统一收敛到客制化选项侧（updateOption），避免双向写入竞争。

  // ──── 选项列表（供 SelectPicker） ────

  async getIngredientOptionSelectList() {
    return ingredientRepository.getIngredientOptionSelectList();
  },
};
