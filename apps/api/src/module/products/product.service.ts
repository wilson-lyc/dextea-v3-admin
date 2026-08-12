import { BizError } from '@/common/exceptions/index.js';
import { ProductErrorCodes } from './product.errorcode.js';
import { TagErrorCodes } from '@/module/tags/tag.errorcode.js';
import { productRepository } from './product.repository.js';
import { PRODUCT_STATUS_VALUES } from '@dextea-admin/contracts';
import {
  validateStatus,
  isDuplicateKeyError,
  isSystemError,
} from '@/utils';
import type { BizErrorCode } from '@/common/types/index.js';
import type {
  ProductListRequest,
  CreateProductRequest,
  UpdateProductRequest,
  UpdateProductStatusRequest,
  BatchUpdateProductStatusRequest,
  BindTagsRequest,
  UnbindTagsRequest,
  BindIngredientRequest,
  UpdateIngredientQuantityRequest,
  UpdateIngredientSortRequest,
  SetProductImagesRequest,
} from '@dextea-admin/contracts';

/**
 * 包裹一次写操作：业务异常（BizError）与系统级异常（数据库 / Redis 等）原样抛出，
 * 交由全局拦截器分别给出具体业务提示或「服务器内部异常」；
 * 其余非预期异常统一归并为操作级失败提示（如「创建失败」）。
 */
async function withMutation<T>(action: () => Promise<T>, failedCode: BizErrorCode): Promise<T> {
  try {
    return await action();
  } catch (err) {
    if (err instanceof BizError) throw err;
    if (isSystemError(err)) throw err;
    throw new BizError(failedCode);
  }
}

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
    return withMutation(async () => {
      const { name, brief, description, price, status } = input;

      if (status !== undefined) {
        validateStatus(status, PRODUCT_STATUS_VALUES, '商品状态');
      }

      const insertId = await productRepository.createProduct({
        name,
        brief: brief ?? '',
        description: description ?? '',
        price: String(price ?? 0),
        status: status ?? 0,
      });
      if (!insertId) {
        throw new BizError(ProductErrorCodes.CREATE_FAILED);
      }

      return { id: insertId };
    }, ProductErrorCodes.CREATE_FAILED);
  },

  // ─── 更新商品 ─────────────────────────────────────

  async updateProduct(id: number, input: UpdateProductRequest) {
    const { name, brief, description, price, status } = input;

    if (status !== undefined) {
      validateStatus(status, PRODUCT_STATUS_VALUES, '商品状态');
    }

    return withMutation(async () => {
      const runMutation = async () => {
        const product = await productRepository.getProductById(id);
        if (!product) {
          throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
        }

        if (name !== undefined) {
          if (!name) throw new BizError(ProductErrorCodes.NAME_REQUIRED);
        }

        const updateData: Partial<Omit<typeof product, 'price'> & { price: string }> = {};
        if (name !== undefined) updateData.name = name;
        if (brief !== undefined) updateData.brief = brief;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = String(price);
        if (status !== undefined) updateData.status = status;

        if (Object.keys(updateData).length > 0) {
          await productRepository.updateProductById(id, updateData);
        }

        const updated = await productRepository.getProductById(id);
        if (!updated) {
          throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
        }
        const tags = await productRepository.getProductTagsById(id);

        return { ...updated, tags };
      };

      return runMutation();
    }, ProductErrorCodes.UPDATE_FAILED);
  },

  // ─── 上下架商品 ───────────────────────────────────

  async updateProductStatus(id: number, input: UpdateProductStatusRequest) {
    const { status } = input;

    validateStatus(status, PRODUCT_STATUS_VALUES, '商品状态');

    return withMutation(async () => {
      const product = await productRepository.getProductById(id);
      if (!product) {
        throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
      }

      await productRepository.updateProductById(id, { status });

      const updated = await productRepository.getProductById(id);

      return updated!;
    }, ProductErrorCodes.STATUS_UPDATE_FAILED);
  },

  // ─── 批量更新商品状态 ─────────────────────────────

  async batchUpdateProductStatus(input: BatchUpdateProductStatusRequest) {
    const { ids, status } = input;

    validateStatus(status, PRODUCT_STATUS_VALUES, '商品状态');

    const uniqueIds = [...new Set(ids)];

    return withMutation(async () => {
      let updatedCount = 0;
      for (const id of uniqueIds) {
        const affected = await productRepository.batchUpdateProductStatus([id], status);
        updatedCount += affected;
      }
      return { updatedCount };
    }, ProductErrorCodes.STATUS_UPDATE_FAILED);
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
    return withMutation(async () => {
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
    }, ProductErrorCodes.TAG_BIND_FAILED);
  },

  // ─── 批量解绑标签 ─────────────────────────────────

  async unbindTagFromProduct(productId: number, input: UnbindTagsRequest) {
    return withMutation(async () => {
      const uniqueIds = [...new Set(input.tagIds)];

      await productRepository.deleteProductTagRelations(productId, uniqueIds);
    }, ProductErrorCodes.TAG_UNBIND_FAILED);
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
    return withMutation(async () => {
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
    }, ProductErrorCodes.INGREDIENT_BIND_FAILED);
  },

  // ─── 更新原料用量 ─────────────────────────────────

  async updateIngredientQuantity(
    productId: number,
    ingredientId: number,
    input: UpdateIngredientQuantityRequest,
  ) {
    return withMutation(async () => {
      const { quantity } = input;

      const existing = await productRepository.getProductIngredientRelation(productId, ingredientId);
      if (!existing) {
        throw new BizError(ProductErrorCodes.INGREDIENT_BIND_NOT_FOUND);
      }

      await productRepository.updateProductIngredientQuantity(productId, ingredientId, quantity);
    }, ProductErrorCodes.INGREDIENT_QUANTITY_UPDATE_FAILED);
  },

  // ─── 更新原料排序 ─────────────────────────────────

  async updateIngredientSort(
    productId: number,
    ingredientId: number,
    input: UpdateIngredientSortRequest,
  ) {
    return withMutation(async () => {
      const { sort } = input;

      const existing = await productRepository.getProductIngredientRelation(productId, ingredientId);
      if (!existing) {
        throw new BizError(ProductErrorCodes.INGREDIENT_BIND_NOT_FOUND);
      }

      await productRepository.updateProductIngredientSort(productId, ingredientId, sort);
    }, ProductErrorCodes.INGREDIENT_SORT_UPDATE_FAILED);
  },

  // ─── 解绑原料 ─────────────────────────────────────

  async unbindIngredient(productId: number, ingredientId: number) {
    return withMutation(async () => {
      await productRepository.deleteProductIngredientRelation(productId, ingredientId);
    }, ProductErrorCodes.INGREDIENT_UNBIND_FAILED);
  },

  // ─── 商品选项列表 ─────────────────────────────────

  async getProductOptionSelectList() {
    return productRepository.getProductOptionSelectList();
  },

  // ─── 商品图片（封面图 + 图库） ───────────────────

  async getProductImages(id: number) {
    const product = await productRepository.getProductById(id);
    if (!product) {
      throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
    }
    return productRepository.getProductImages(id);
  },

  async setProductImages(id: number, input: SetProductImagesRequest) {
    return withMutation(async () => {
      const product = await productRepository.getProductById(id);
      if (!product) {
        throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
      }

      const { coverImageId, galleryImageIds } = input;

      // 同一 type 内图片不可重复（主键 product_id + image_id + type）
      const uniqueGallery = [...new Set(galleryImageIds)];
      if (uniqueGallery.length !== galleryImageIds.length) {
        throw new BizError(ProductErrorCodes.IMAGE_DUPLICATED);
      }

      // 统一校验所引用的图片资源是否存在于图片资源池
      const referencedIds = [
        ...(coverImageId !== null ? [coverImageId] : []),
        ...uniqueGallery,
      ];
      if (referencedIds.length > 0) {
        const existing = await productRepository.getGalleryImagesByIds(referencedIds);
        const existingIds = new Set(existing.map((r) => r.id));
        const missing = referencedIds.filter((rid) => !existingIds.has(rid));
        if (missing.length > 0) {
          throw new BizError(ProductErrorCodes.IMAGE_NOT_FOUND);
        }
      }

      // 全量替换：事务内先删后插，封面与图库各自写入
      await productRepository.setProductImages(id, coverImageId, uniqueGallery);

      // 返回保存后的最新图片
      return productRepository.getProductImages(id);
    }, ProductErrorCodes.IMAGE_BIND_FAILED);
  },
};
