import { BizError } from '@/common/exceptions/index.js';
import { TagErrorCodes } from './tag.errorcode.js';
import { tagRepository } from './tag.repository.js';
import type {
  TagListRequest,
  CreateTagRequest,
  UpdateTagRequest,
  BindProductsRequest,
  UnbindProductsRequest,
  TagProductsRequest,
} from '@dextea-admin/contracts';

export const tagService = {
  async getTagOptions() {
    return tagRepository.getTagOptions();
  },

  async getTagList(params: TagListRequest) {
    return tagRepository.getTagList(params.page, params.pageSize);
  },

  async getTagById(id: number) {
    const tag = await tagRepository.getTagById(id);
    if (!tag) {
      throw new BizError(TagErrorCodes.TAG_NOT_FOUND);
    }
    return tag;
  },

  async createTag(input: CreateTagRequest) {
    const trimmedName = input.name.trim();

    const existing = await tagRepository.getTagByName(trimmedName);
    if (existing) {
      throw new BizError(TagErrorCodes.DUPLICATE_NAME);
    }

    const id = await tagRepository.createTag(trimmedName);
    return { id, name: trimmedName };
  },

  async updateTag(id: number, input: UpdateTagRequest) {
    const trimmedName = input.name.trim();

    const tag = await tagRepository.getTagById(id);
    if (!tag) {
      throw new BizError(TagErrorCodes.TAG_NOT_FOUND);
    }

    const duplicate = await tagRepository.getTagByName(trimmedName);
    if (duplicate && duplicate.id !== id) {
      throw new BizError(TagErrorCodes.DUPLICATE_NAME);
    }

    await tagRepository.updateTagById(id, trimmedName);
    return { id, name: trimmedName };
  },

  async deleteTag(id: number) {
    const tag = await tagRepository.getTagById(id);
    if (!tag) {
      throw new BizError(TagErrorCodes.TAG_NOT_FOUND);
    }

    await tagRepository.deleteTagProductRelations(id);
    await tagRepository.deleteTagById(id);
  },

  async getTagProducts(tagId: number, params: TagProductsRequest) {
    const tag = await tagRepository.getTagById(tagId);
    if (!tag) {
      throw new BizError(TagErrorCodes.TAG_NOT_FOUND);
    }

    return tagRepository.getTagProducts(tagId, params.page, params.pageSize);
  },

  async bindProductsToTag(tagId: number, input: BindProductsRequest) {
    const uniqueIds = [...new Set(input.productIds)];

    const tag = await tagRepository.getTagById(tagId);
    if (!tag) {
      throw new BizError(TagErrorCodes.TAG_NOT_FOUND);
    }

    const existingProductIds = await tagRepository.getExistingProductIds(uniqueIds);
    if (existingProductIds.length !== uniqueIds.length) {
      // 如果缺少某些商品，统一抛商品不存在错误
      throw new BizError(TagErrorCodes.BIND_FAILED);
    }

    const existingBindings = await tagRepository.getExistingBindings(tagId, uniqueIds);
    const boundProductIds = new Set(existingBindings.map(r => r.productId));
    const toInsert = uniqueIds.filter(pid => !boundProductIds.has(pid));

    if (toInsert.length === 0) {
      throw new BizError(TagErrorCodes.PRODUCT_ALREADY_BOUND);
    }

    await tagRepository.bindProducts(tagId, toInsert);
    return { boundCount: toInsert.length };
  },

  async unbindProductsFromTag(tagId: number, input: UnbindProductsRequest) {
    const tag = await tagRepository.getTagById(tagId);
    if (!tag) {
      throw new BizError(TagErrorCodes.TAG_NOT_FOUND);
    }

    await tagRepository.unbindProducts(tagId, input.productIds);
  },
};
