import { BizError } from '@/common/exceptions/index.js';
import { ProductCustomizationErrorCodes } from './product-customization.errorcode.js';
import { productCustomizationRepository } from './product-customization.repository.js';
import { PRODUCT_CUSTOMIZATION_STATUS_VALUES, CUSTOMIZATION_OPTION_STATUS_VALUES } from './product-customization.type.js';
import { validateMaxLength } from '@/plugins/utils/validation.js';
import type {
  ProductCustomizationListRequest,
  CreateProductCustomizationRequest,
  UpdateProductCustomizationRequest,
  UpdateProductCustomizationStatusRequest,
  CreateCustomizationOptionRequest,
  UpdateCustomizationOptionRequest,
} from './product-customization.type.js';

export const productCustomizationService = {
  async getCustomizationList(params: ProductCustomizationListRequest) {
    return productCustomizationRepository.getCustomizationList(
      params.page,
      params.pageSize,
      params.keyword,
      params.status,
      params.productId,
    );
  },

  async getCustomizationById(id: number) {
    const customization = await productCustomizationRepository.getCustomizationById(id);
    if (!customization) {
      throw new BizError(ProductCustomizationErrorCodes.NOT_FOUND);
    }
    return customization;
  },

  async createCustomization(input: CreateProductCustomizationRequest) {
    const { productId, name } = input;

    const product = await productCustomizationRepository.getProductById(productId);
    if (!product) {
      throw new BizError(ProductCustomizationErrorCodes.PRODUCT_NOT_FOUND);
    }

    const trimmedName = name.trim();
    validateMaxLength(trimmedName, 255, '客制化项目名称');

    const insertId = await productCustomizationRepository.createCustomization({
      productId,
      name: trimmedName,
    });

    const created = await productCustomizationRepository.getCustomizationById(insertId);
    return created!;
  },

  async updateCustomization(id: number, input: UpdateProductCustomizationRequest) {
    const { name, status } = input;

    const existing = await productCustomizationRepository.getCustomizationById(id);
    if (!existing) {
      throw new BizError(ProductCustomizationErrorCodes.NOT_FOUND);
    }

    const trimmedName = name.trim();
    validateMaxLength(trimmedName, 255, '客制化项目名称');

    const updateData: Record<string, unknown> = {
      name: trimmedName,
    };
    if (status !== undefined) {
      if ((PRODUCT_CUSTOMIZATION_STATUS_VALUES as readonly number[]).includes(status)) {
        updateData.status = status;
      }
    }

    await productCustomizationRepository.updateCustomizationById(id, updateData);

    const updated = await productCustomizationRepository.getCustomizationById(id);
    return updated!;
  },

  async updateCustomizationStatus(id: number, input: UpdateProductCustomizationStatusRequest) {
    const { status } = input;

    if (!(PRODUCT_CUSTOMIZATION_STATUS_VALUES as readonly number[]).includes(status)) {
      throw new BizError(ProductCustomizationErrorCodes.INVALID_STATUS);
    }

    const existing = await productCustomizationRepository.getCustomizationById(id);
    if (!existing) {
      throw new BizError(ProductCustomizationErrorCodes.NOT_FOUND);
    }

    await productCustomizationRepository.updateCustomizationById(id, { status });

    const updated = await productCustomizationRepository.getCustomizationById(id);
    return updated!;
  },

  async getOptionList(customizationId: number) {
    return productCustomizationRepository.getOptionList(customizationId);
  },

  async createOption(customizationId: number, input: CreateCustomizationOptionRequest) {
    const { name, price, sort, ingredientId, quantity } = input;

    const existing = await productCustomizationRepository.getCustomizationById(customizationId);
    if (!existing) {
      throw new BizError(ProductCustomizationErrorCodes.NOT_FOUND);
    }

    const trimmedName = name.trim();
    validateMaxLength(trimmedName, 255, '客制化选项名称');

    if (ingredientId != null) {
      const ingredient = await productCustomizationRepository.getIngredientById(ingredientId);
      if (!ingredient) {
        throw new BizError(ProductCustomizationErrorCodes.INGREDIENT_NOT_FOUND);
      }
    }

    const insertId = await productCustomizationRepository.createOption({
      customizationId,
      name: trimmedName,
      price: price ?? 0,
      sort: sort ?? 0,
      ingredientId: ingredientId ?? null,
      quantity: quantity ?? 0,
    });

    const created = await productCustomizationRepository.getOptionByIdWithIngredient(insertId);
    return created!;
  },

  async updateOption(customizationId: number, optionId: number, input: UpdateCustomizationOptionRequest) {
    const { name, price, sort, status, ingredientId, quantity } = input;

    const option = await productCustomizationRepository.getOptionById(optionId);
    if (!option || option.customizationId !== customizationId) {
      throw new BizError(ProductCustomizationErrorCodes.OPTION_NOT_FOUND);
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      const trimmedName = name.trim();
      validateMaxLength(trimmedName, 255, '客制化选项名称');
      updateData.name = trimmedName;
    }
    if (price !== undefined) updateData.price = price;
    if (sort !== undefined) updateData.sort = sort;
    if (status !== undefined) {
      if ((CUSTOMIZATION_OPTION_STATUS_VALUES as readonly number[]).includes(status)) {
        updateData.status = status;
      }
    }
    if (ingredientId !== undefined) {
      if (ingredientId != null) {
        const ingredient = await productCustomizationRepository.getIngredientById(ingredientId);
        if (!ingredient) {
          throw new BizError(ProductCustomizationErrorCodes.INGREDIENT_NOT_FOUND);
        }
      }
      updateData.ingredientId = ingredientId;
    }
    if (quantity !== undefined) updateData.quantity = quantity;

    if (Object.keys(updateData).length > 0) {
      await productCustomizationRepository.updateOptionById(optionId, updateData);
    }

    const updated = await productCustomizationRepository.getOptionByIdWithIngredient(optionId);
    return updated!;
  },

  async deleteOption(customizationId: number, optionId: number) {
    const option = await productCustomizationRepository.getOptionById(optionId);
    if (!option || option.customizationId !== customizationId) {
      throw new BizError(ProductCustomizationErrorCodes.OPTION_NOT_FOUND);
    }

    await productCustomizationRepository.deleteOptionById(optionId);
  },
};
