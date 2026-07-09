import { BizError } from '@/common/exceptions/index.js';
import { StoreErrorCodes } from '@/module/stores/store.errorcode.js';
import { storeStatusRepository } from './store-status.repository.js';

async function ensureStoreExists(storeId: number): Promise<void> {
  const store = await storeStatusRepository.getStoreById(storeId);
  if (!store) throw new BizError(StoreErrorCodes.STORE_NOT_FOUND);
}

export const storeStatusService = {
  async listStoreProducts(
    storeId: number,
    params: { page: number; pageSize: number; globalStatus?: number; storeStatus?: number },
  ) {
    await ensureStoreExists(storeId);
    return storeStatusRepository.listStoreProducts(storeId, params);
  },

  async upsertProductStoreStatus(storeId: number, productId: number, status: number) {
    await ensureStoreExists(storeId);
    await storeStatusRepository.upsertProductStoreStatus(storeId, productId, status);
  },

  async listStoreCustomizations(storeId: number, params: { page: number; pageSize: number }) {
    await ensureStoreExists(storeId);
    return storeStatusRepository.listStoreCustomizations(storeId, params);
  },

  async listStoreCustomizationOptions(
    storeId: number,
    customizationId: number,
    params: { page: number; pageSize: number },
  ) {
    await ensureStoreExists(storeId);
    return storeStatusRepository.listStoreCustomizationOptions(storeId, customizationId, params);
  },

  async upsertCustomizationOptionStoreStatus(storeId: number, optionId: number, status: number) {
    await ensureStoreExists(storeId);
    await storeStatusRepository.upsertCustomizationOptionStoreStatus(storeId, optionId, status);
  },

  async listStoreIngredients(storeId: number, params: { page: number; pageSize: number }) {
    await ensureStoreExists(storeId);
    return storeStatusRepository.listStoreIngredients(storeId, params);
  },
};
