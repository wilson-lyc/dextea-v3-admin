import { BizError } from '@/common/exceptions/index.js';
import { ProductErrorCodes } from './product.errorcode.js';
import { TagErrorCodes } from '@/module/tags/tag.errorcode.js';
import { productRepository } from './product.repository.js';
import { PRODUCT_STATUS_VALUES } from '@dextea-admin/contracts';
import { validateMaxLength, validatePrice, validateStatus } from '@/plugins/utils/validation.js';
import { isDuplicateKeyError } from '@/plugins/utils/mysql-error.js';
import type {
  ProductListRequest,
  CreateProductRequest,
  UpdateProductRequest,
  UpdateProductStatusRequest,
  BindTagsRequest,
  UnbindTagsRequest,
  BindIngredientRequest,
  UpdateIngredientQuantityRequest,
  UpdateIngredientSortRequest,
} from '@dextea-admin/contracts';

export const productService = {
  // ─── 商品列表 ─────────────────────────────────────

  async getProductList(params: ProductListRequest) {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(100, Math.max(1, params.pageSize));
    const keyword = params.keyword;
    const status = params.status;
    const priceMin = params.priceMin;
    const priceMax = params.priceMax;
    const tagIds = params.tagIds
      ? params.tagIds.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0)
      : undefined;

    return productRepository.getProductListWithPage(
      page,
      pageSize,
      keyword,
      status,
      priceMin,
      priceMax,
      tagIds,
    );
  },

  // ─── 商品基础信息 ─────────────────────────────────

  async getProductBasicInfo(id: number) {
    const product = await productRepository.getProductById(id);
    if (!product) {
      throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
    }

    const tags = await productRepository.getProductTagsById(id);

    return { ...product, tags };
  },

  // ─── 新增商品 ─────────────────────────────────────

  async createProduct(input: CreateProductRequest) {
    const { name, brief, description, price, status } = input;

    validateMaxLength(name, 255, '商品名称');
    validateMaxLength(brief, 500, '简介');
    validateMaxLength(description, 2000, '描述');

    if (price !== undefined) {
      validatePrice(price);
    }
    if (status !== undefined) {
      validateStatus(status, PRODUCT_STATUS_VALUES, '商品状态');
    }

    const insertId = await productRepository.createProduct({
      name,
      brief: brief ?? '',
      description: description ?? '',
      price: price ?? 0,
      status: status ?? 0,
    });

    return { id: insertId };
  },

  // ─── 更新商品 ─────────────────────────────────────

  async updateProduct(id: number, input: UpdateProductRequest) {
    const { name, brief, description, price, status } = input;

    const product = await productRepository.getProductById(id);
    if (!product) {
      throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
    }

    if (name !== undefined) {
      if (!name) throw new BizError(ProductErrorCodes.NAME_REQUIRED);
      validateMaxLength(name, 255, '商品名称');
    }
    if (brief !== undefined) {
      validateMaxLength(brief, 500, '简介');
    }
    if (description !== undefined) {
      validateMaxLength(description, 2000, '描述');
    }
    if (price !== undefined) {
      validatePrice(price);
    }
    if (status !== undefined) {
      validateStatus(status, PRODUCT_STATUS_VALUES, '商品状态');
    }

    const updateData: Partial<typeof product> = {};
    if (name !== undefined) updateData.name = name;
    if (brief !== undefined) updateData.brief = brief;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length > 0) {
      await productRepository.updateProductById(id, updateData);
    }

    const updated = await productRepository.getProductById(id);
    const tags = await productRepository.getProductTagsById(id);

    return { ...updated, tags };
  },

  // ─── 上下架商品 ───────────────────────────────────

  async updateProductStatus(id: number, input: UpdateProductStatusRequest) {
    const { status } = input;

    validateStatus(status, PRODUCT_STATUS_VALUES, '商品状态');

    const product = await productRepository.getProductById(id);
    if (!product) {
      throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
    }

    await productRepository.updateProductById(id, { status });

    const updated = await productRepository.getProductById(id);

    return updated!;
  },

  // ─── 商品标签列表（分页） ─────────────────────────

  async getProductTagList(id: number, page: number, pageSize: number) {
    const product = await productRepository.getProductById(id);
    if (!product) {
      throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
    }

    return productRepository.getProductTagListWithPage(id, page, pageSize);
  },

  // ─── 批量绑定标签 ─────────────────────────────────

  async bindTagToProduct(productId: number, input: BindTagsRequest) {
    const uniqueIds = [...new Set(input.tagIds)];

    const product = await productRepository.getProductById(productId);
    if (!product) {
      throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
    }

    // 校验标签本身是否存在（标签不存在时给出明确反馈）
    const existingTags = await productRepository.getTagsByIds(uniqueIds);
    if (existingTags.length !== uniqueIds.length) {
      throw new BizError(TagErrorCodes.TAG_NOT_FOUND);
    }

    // 唯一性由数据库复合主键 (product_id, tag_id) 保证：
    // 写入失败即代表该标签已关联此商品，捕获唯一键冲突并给出明确反馈。
    try {
      await productRepository.insertProductTagRelations(
        uniqueIds.map(tagId => ({ productId, tagId })),
      );
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new BizError(ProductErrorCodes.TAG_ALREADY_EXISTS);
      }
      throw err;
    }

    return { boundCount: uniqueIds.length };
  },

  // ─── 批量解绑标签 ─────────────────────────────────

  async unbindTagFromProduct(productId: number, input: UnbindTagsRequest) {
    const uniqueIds = [...new Set(input.tagIds)];

    await productRepository.deleteProductTagRelations(productId, uniqueIds);
  },

  // ─── 商品原料列表（分页） ─────────────────────────

  async getProductIngredientList(productId: number, page: number, pageSize: number) {
    const product = await productRepository.getProductById(productId);
    if (!product) {
      throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
    }

    return productRepository.getProductIngredientListWithPage(productId, page, pageSize);
  },

  // ─── 绑定原料 ─────────────────────────────────────

  async bindIngredient(productId: number, input: BindIngredientRequest) {
    const { ingredientId, quantity, sort } = input;

    const ingredient = await productRepository.getIngredientById(ingredientId);
    if (!ingredient) {
      throw new BizError(ProductErrorCodes.INGREDIENT_NOT_FOUND);
    }

    const existing = await productRepository.getProductIngredientRelation(productId, ingredientId);
    if (existing) {
      throw new BizError(ProductErrorCodes.INGREDIENT_ALREADY_BOUND);
    }

    await productRepository.insertProductIngredientRelation({
      productId,
      ingredientId,
      quantity: quantity ?? 0,
      sort: sort ?? 0,
    });
  },

  // ─── 更新原料用量 ─────────────────────────────────

  async updateIngredientQuantity(
    productId: number,
    ingredientId: number,
    input: UpdateIngredientQuantityRequest,
  ) {
    const { quantity } = input;

    const existing = await productRepository.getProductIngredientRelation(productId, ingredientId);
    if (!existing) {
      throw new BizError(ProductErrorCodes.INGREDIENT_BIND_NOT_FOUND);
    }

    await productRepository.updateProductIngredientQuantity(productId, ingredientId, quantity);
  },

  // ─── 更新原料排序 ─────────────────────────────────

  async updateIngredientSort(
    productId: number,
    ingredientId: number,
    input: UpdateIngredientSortRequest,
  ) {
    const { sort } = input;

    const existing = await productRepository.getProductIngredientRelation(productId, ingredientId);
    if (!existing) {
      throw new BizError(ProductErrorCodes.INGREDIENT_BIND_NOT_FOUND);
    }

    await productRepository.updateProductIngredientSort(productId, ingredientId, sort);
  },

  // ─── 解绑原料 ─────────────────────────────────────

  async unbindIngredient(productId: number, ingredientId: number) {
    await productRepository.deleteProductIngredientRelation(productId, ingredientId);
  },

  // ─── 商品选项列表 ─────────────────────────────────

  async getProductOptionSelectList() {
    return productRepository.getProductOptionSelectList();
  },
};
