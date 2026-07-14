import { BizError } from '@/common/exceptions/index.js';
import { CustomizationErrorCodes } from './customization.errorcode.js';
import { customizationRepository } from './customization.repository.js';
import { validateMaxLength, validateSort } from '@/utils';
import {
  CUSTOMIZATION_STATUS,
  CUSTOMIZATION_STATUS_VALUES,
  CUSTOMIZATION_OPTION_STATUS,
  CUSTOMIZATION_OPTION_STATUS_VALUES,
} from '@dextea-admin/contracts';
import type {
  CustomizationListRequest,
  CreateCustomizationRequest,
  UpdateCustomizationRequest,
  UpdateCustomizationStatusRequest,
  CreateCustomizationOptionRequest,
  UpdateCustomizationOptionRequest,
} from '@dextea-admin/contracts';

export const customizationService = {
  async getCustomizationList(params: CustomizationListRequest) {
    return customizationRepository.getCustomizationList(
      params.page,
      params.pageSize,
      params.keyword,
      params.status,
      params.productId,
    );
  },

  async getCustomizationById(id: number) {
    const customization = await customizationRepository.getCustomizationById(id);
    if (!customization) {
      throw new BizError(CustomizationErrorCodes.NOT_FOUND);
    }
    return customization;
  },

  async createCustomization(input: CreateCustomizationRequest) {
    const { productId, name } = input;

    const product = await customizationRepository.getProductById(productId);
    if (!product) {
      throw new BizError(CustomizationErrorCodes.PRODUCT_NOT_FOUND);
    }

    const trimmedName = name.trim();
    validateMaxLength(trimmedName, 255, '客制化项目名称');

    // 排序：未指定时自动排到该商品内末尾
    let sort = input.sort ?? 0;
    if (input.sort !== undefined) {
      validateSort(input.sort, '客制化项目排序');
    }
    if (input.sort === undefined) {
      const maxSort = await customizationRepository.getMaxSortByProductId(productId);
      sort = maxSort + 1;
    }

    const insertId = await customizationRepository.createCustomization({
      productId,
      name: trimmedName,
      sort,
      status: CUSTOMIZATION_STATUS.DISABLED.value,
    });

    const created = await customizationRepository.getCustomizationById(insertId);
    return created!;
  },

  async updateCustomization(id: number, input: UpdateCustomizationRequest) {
    const { name, sort, status } = input;

    const existing = await customizationRepository.getCustomizationById(id);
    if (!existing) {
      throw new BizError(CustomizationErrorCodes.NOT_FOUND);
    }

    const trimmedName = name.trim();
    validateMaxLength(trimmedName, 255, '客制化项目名称');

    const updateData: Record<string, unknown> = {
      name: trimmedName,
    };
    if (sort !== undefined) {
      validateSort(sort, '客制化项目排序');
      updateData.sort = sort;
    }
    if (status !== undefined) {
      if ((CUSTOMIZATION_STATUS_VALUES as readonly number[]).includes(status)) {
        updateData.status = status;
      }
    }

    await customizationRepository.updateCustomizationById(id, updateData);

    const updated = await customizationRepository.getCustomizationById(id);
    return updated!;
  },

  async updateCustomizationStatus(id: number, input: UpdateCustomizationStatusRequest) {
    const { status } = input;

    if (!(CUSTOMIZATION_STATUS_VALUES as readonly number[]).includes(status)) {
      throw new BizError(CustomizationErrorCodes.INVALID_STATUS);
    }

    const existing = await customizationRepository.getCustomizationById(id);
    if (!existing) {
      throw new BizError(CustomizationErrorCodes.NOT_FOUND);
    }

    await customizationRepository.updateCustomizationById(id, { status });

    const updated = await customizationRepository.getCustomizationById(id);
    return updated!;
  },

  async getOptionList(customizationId: number) {
    return customizationRepository.getOptionList(customizationId);
  },

  async createOption(customizationId: number, input: CreateCustomizationOptionRequest) {
    const { name, price, sort, ingredientId, quantity } = input;

    const existing = await customizationRepository.getCustomizationById(customizationId);
    if (!existing) {
      throw new BizError(CustomizationErrorCodes.NOT_FOUND);
    }

    const trimmedName = name.trim();
    validateMaxLength(trimmedName, 255, '客制化选项名称');

    if (sort !== undefined) {
      validateSort(sort, '客制化选项排序');
    }

    if (ingredientId != null) {
      const ingredient = await customizationRepository.getIngredientById(ingredientId);
      if (!ingredient) {
        throw new BizError(CustomizationErrorCodes.INGREDIENT_NOT_FOUND);
      }
    }

    const insertId = await customizationRepository.createOption({
      customizationId,
      name: trimmedName,
      price: price ?? 0,
      sort: sort ?? 0,
      status: CUSTOMIZATION_OPTION_STATUS.DISABLED.value,
      ingredientId: ingredientId ?? null,
      ingredientQuantity: quantity ?? 0,
    });

    const created = await customizationRepository.getOptionByIdWithIngredient(insertId);
    return created!;
  },

  async updateOption(customizationId: number, optionId: number, input: UpdateCustomizationOptionRequest) {
    const { name, price, sort, status } = input;

    const option = await customizationRepository.getOptionById(optionId);
    if (!option || option.customizationId !== customizationId) {
      throw new BizError(CustomizationErrorCodes.OPTION_NOT_FOUND);
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      const trimmedName = name.trim();
      validateMaxLength(trimmedName, 255, '客制化选项名称');
      updateData.name = trimmedName;
    }
    if (price !== undefined) updateData.price = price;
    if (sort !== undefined) {
      validateSort(sort, '客制化选项排序');
      updateData.sort = sort;
    }
    if (status !== undefined) {
      if ((CUSTOMIZATION_OPTION_STATUS_VALUES as readonly number[]).includes(status)) {
        updateData.status = status;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await customizationRepository.updateOptionById(optionId, updateData);
    }
    return customizationRepository.getOptionByIdWithIngredient(optionId);
  },

  async updateOptionQuantity(customizationId: number, optionId: number, quantity: number) {
    const option = await customizationRepository.getOptionById(optionId);
    if (!option || option.customizationId !== customizationId) {
      throw new BizError(CustomizationErrorCodes.OPTION_NOT_FOUND);
    }

    await customizationRepository.updateOptionById(optionId, { ingredientQuantity: quantity });
    return customizationRepository.getOptionByIdWithIngredient(optionId);
  },

  async rebindOptionIngredient(
    customizationId: number,
    optionId: number,
    ingredientId: number | null,
    quantity: number,
  ) {
    const option = await customizationRepository.getOptionById(optionId);
    if (!option || option.customizationId !== customizationId) {
      throw new BizError(CustomizationErrorCodes.OPTION_NOT_FOUND);
    }

    // 换绑到具体原料时须校验原料存在性；解绑（ingredientId 为 null）无需校验。
    if (ingredientId != null) {
      const ingredient = await customizationRepository.getIngredientById(ingredientId);
      if (!ingredient) {
        throw new BizError(CustomizationErrorCodes.INGREDIENT_NOT_FOUND);
      }
    }

    await customizationRepository.updateOptionById(optionId, {
      ingredientId: ingredientId ?? null,
      // 解绑时用量重置为 0；换绑到具体原料时用提交的新用量。
      ingredientQuantity: ingredientId == null ? 0 : quantity,
    });
    return customizationRepository.getOptionByIdWithIngredient(optionId);
  },

  async updateOptionStatus(customizationId: number, optionId: number, status: number) {
    if (!(CUSTOMIZATION_OPTION_STATUS_VALUES as readonly number[]).includes(status)) {
      throw new BizError(CustomizationErrorCodes.INVALID_STATUS);
    }

    const option = await customizationRepository.getOptionById(optionId);
    if (!option || option.customizationId !== customizationId) {
      throw new BizError(CustomizationErrorCodes.OPTION_NOT_FOUND);
    }

    await customizationRepository.updateOptionById(optionId, { status });
    return customizationRepository.getOptionByIdWithIngredient(optionId);
  },
};
