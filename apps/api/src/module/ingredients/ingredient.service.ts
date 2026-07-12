import { BizError } from '@/common/exceptions/index.js';
import { IngredientErrorCodes } from './ingredient.errorcode.js';
import { ingredientRepository } from './ingredient.repository.js';
import { INGREDIENT_STATUS_VALUES } from '@dextea-admin/contracts';
import type {
  IngredientListRequest,
  CreateIngredientRequest,
  UpdateIngredientRequest,
  UpdateIngredientStatusRequest,
  BindProductRequest,
  UpdateBindQuantityRequest,
  BindOptionRequest,
  UpdateOptionQuantityRequest,
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

  // ──── 商品绑定 ────

  async getIngredientProductList(ingredientId: number, page: number, pageSize: number) {
    const ingredient = await ingredientRepository.getIngredientById(ingredientId);
    if (!ingredient) {
      throw new BizError(IngredientErrorCodes.INGREDIENT_NOT_FOUND);
    }

    return ingredientRepository.getIngredientProductList(ingredientId, page, pageSize);
  },

  async bindProduct(ingredientId: number, input: BindProductRequest) {
    const { productId, quantity } = input;

    const ingredient = await ingredientRepository.getIngredientById(ingredientId);
    if (!ingredient) {
      throw new BizError(IngredientErrorCodes.INGREDIENT_NOT_FOUND);
    }

    const product = await ingredientRepository.getProductById(productId);
    if (!product) {
      throw new BizError(IngredientErrorCodes.PRODUCT_NOT_FOUND);
    }

    const existingBind = await ingredientRepository.getBindRecord(ingredientId, productId);
    if (existingBind) {
      throw new BizError(IngredientErrorCodes.PRODUCT_ALREADY_BOUND);
    }

    await ingredientRepository.bindProduct(ingredientId, productId, quantity ?? 0);
  },

  async updateBindQuantity(ingredientId: number, productId: number, input: UpdateBindQuantityRequest) {
    const { quantity } = input;

    const existingBind = await ingredientRepository.getBindRecord(ingredientId, productId);
    if (!existingBind) {
      throw new BizError(IngredientErrorCodes.BIND_NOT_FOUND);
    }

    await ingredientRepository.updateBindQuantity(ingredientId, productId, quantity);
  },

  async unbindProduct(ingredientId: number, productId: number) {
    await ingredientRepository.unbindProduct(ingredientId, productId);
  },

  // ──── 客制化选项绑定 ────

  async getIngredientOptionList(ingredientId: number, page: number, pageSize: number) {
    const ingredient = await ingredientRepository.getIngredientById(ingredientId);
    if (!ingredient) {
      throw new BizError(IngredientErrorCodes.INGREDIENT_NOT_FOUND);
    }

    return ingredientRepository.getIngredientOptionList(ingredientId, page, pageSize);
  },

  async bindOption(ingredientId: number, input: BindOptionRequest) {
    const { optionId, quantity } = input;

    const ingredient = await ingredientRepository.getIngredientById(ingredientId);
    if (!ingredient) {
      throw new BizError(IngredientErrorCodes.INGREDIENT_NOT_FOUND);
    }

    const option = await ingredientRepository.getOptionById(optionId);
    if (!option) {
      throw new BizError(IngredientErrorCodes.OPTION_NOT_FOUND);
    }

    // 6.1 修复：选项仅能绑定到一个原料，禁止静默改派到其他原料
    if (option.ingredientId != null && option.ingredientId !== ingredientId) {
      throw new BizError(IngredientErrorCodes.OPTION_BOUND_TO_OTHER_INGREDIENT);
    }

    await ingredientRepository.bindOption(optionId, ingredientId, quantity ?? 0);
  },

  async updateOptionQuantity(ingredientId: number, optionId: number, input: UpdateOptionQuantityRequest) {
    const { quantity } = input;

    const option = await ingredientRepository.getOptionById(optionId);
    if (!option || option.ingredientId !== ingredientId) {
      throw new BizError(IngredientErrorCodes.OPTION_BIND_NOT_FOUND);
    }

    await ingredientRepository.updateOptionQuantity(optionId, quantity);
  },

  async unbindOption(ingredientId: number, optionId: number) {
    const option = await ingredientRepository.getOptionById(optionId);
    if (!option || option.ingredientId !== ingredientId) {
      throw new BizError(IngredientErrorCodes.OPTION_BIND_NOT_FOUND);
    }

    await ingredientRepository.unbindOption(optionId);
  },

  // ──── 选项列表（供 SelectPicker） ────

  async getIngredientOptionSelectList() {
    return ingredientRepository.getIngredientOptionSelectList();
  },
};
