import { BizError } from '@/common/exceptions/index.js';
import { StoreCatalogErrorCodes } from './store-catalog.errorcode.js';
import { storeCatalogRepository } from './store-catalog.repository.js';
import { STORE_PRODUCT_STATUS_VALUES } from '@dextea-admin/contracts';
import { withDistributedLock } from '@/plugins/lock/index.js';

// 商品门店状态锁键（完整键为 dextea:lock:update_product_store_status:p{商品ID}_s{门店ID}）
function productStoreStatusLockKey(storeId: number, productId: number): string {
  return `update_product_store_status:p${productId}_s${storeId}`;
}

// 客制化选项门店状态锁键（完整键为 dextea:lock:update_customization_option_store_stauts:o{选项ID}_s{门店ID}）
function customizationOptionStoreStatusLockKey(storeId: number, optionId: number): string {
  return `update_customization_option_store_stauts:o${optionId}_s${storeId}`;
}

// 校验门店是否存在（门店目录子资源接口共用）
async function ensureStoreExists(storeId: number): Promise<void> {
  const store = await storeCatalogRepository.getStoreById(storeId);
  if (!store) throw new BizError(StoreCatalogErrorCodes.STORE_NOT_FOUND);
}

export const storeCatalogService = {
  async listStoreProducts(
    storeId: number,
    params: { page: number; pageSize: number; globalStatus?: number; storeStatus?: number },
  ) {
    await ensureStoreExists(storeId);
    return storeCatalogRepository.listStoreProducts(storeId, params);
  },

  async upsertProductStoreStatus(storeId: number, productId: number, status: number) {
    if (!STORE_PRODUCT_STATUS_VALUES.includes(status as 0 | 1)) {
      throw new BizError(StoreCatalogErrorCodes.INVALID_STATUS);
    }
    await ensureStoreExists(storeId);
    return withDistributedLock(
      productStoreStatusLockKey(storeId, productId),
      async () => {
        await storeCatalogRepository.upsertProductStoreStatus(storeId, productId, status);
      },
    );
  },

  async batchUpdateProductStoreStatus(storeId: number, productIds: number[], status: number) {
    if (!STORE_PRODUCT_STATUS_VALUES.includes(status as 0 | 1)) {
      throw new BizError(StoreCatalogErrorCodes.INVALID_STATUS);
    }
    await ensureStoreExists(storeId);

    const uniqueIds = [...new Set(productIds)];
    let updatedCount = 0;

    for (const productId of uniqueIds) {
      await withDistributedLock(productStoreStatusLockKey(storeId, productId), async () => {
        await storeCatalogRepository.upsertProductStoreStatus(storeId, productId, status);
        updatedCount += 1;
      });
    }

    return { updatedCount };
  },

  async listStoreCustomizations(
    storeId: number,
    params: { page: number; pageSize: number; productId?: number },
  ) {
    await ensureStoreExists(storeId);
    return storeCatalogRepository.listStoreCustomizations(storeId, params);
  },

  async listStoreCustomizationOptions(
    storeId: number,
    customizationId: number,
    params: { page: number; pageSize: number },
  ) {
    await ensureStoreExists(storeId);
    return storeCatalogRepository.listStoreCustomizationOptions(storeId, customizationId, params);
  },

  async upsertCustomizationOptionStoreStatus(storeId: number, optionId: number, status: number) {
    if (!STORE_PRODUCT_STATUS_VALUES.includes(status as 0 | 1)) {
      throw new BizError(StoreCatalogErrorCodes.INVALID_STATUS);
    }
    await ensureStoreExists(storeId);
    return withDistributedLock(
      customizationOptionStoreStatusLockKey(storeId, optionId),
      async () => {
        await storeCatalogRepository.upsertCustomizationOptionStoreStatus(storeId, optionId, status);
      },
    );
  },

  async batchUpdateCustomizationOptionStoreStatus(storeId: number, optionIds: number[], status: number) {
    if (!STORE_PRODUCT_STATUS_VALUES.includes(status as 0 | 1)) {
      throw new BizError(StoreCatalogErrorCodes.INVALID_STATUS);
    }
    await ensureStoreExists(storeId);

    const uniqueIds = [...new Set(optionIds)];
    let updatedCount = 0;

    for (const optionId of uniqueIds) {
      await withDistributedLock(customizationOptionStoreStatusLockKey(storeId, optionId), async () => {
        await storeCatalogRepository.upsertCustomizationOptionStoreStatus(storeId, optionId, status);
        updatedCount += 1;
      });
    }

    return { updatedCount };
  },

  async listStoreIngredients(storeId: number, params: { page: number; pageSize: number }) {
    await ensureStoreExists(storeId);
    return storeCatalogRepository.listStoreIngredients(storeId, params);
  },
};
