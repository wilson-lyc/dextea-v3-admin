import { status as grpcStatus } from '@grpc/grpc-js';
import { callRpc } from '@/infrastructure/rpc/client.js';

type Product = { id: number; name: string; price: number; status: number };

export const storeCatalogRepository = {
  async getStoreById(id: number) {
    try { return await callRpc('storeAdmin', 'getStore', { id }); } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error &&
        (error as { code?: unknown }).code === grpcStatus.NOT_FOUND) return null;
      throw error;
    }
  },
  async listStoreProducts(storeId: number, params: { page: number; pageSize: number; globalStatus?: number; storeStatus?: number }) {
    const result = await callRpc<{ products: Product[]; total: string | number; page: number; pageSize: number }>('productAdmin', 'listProducts', { page: params.page, pageSize: params.pageSize, ...(params.globalStatus === undefined ? {} : { status: params.globalStatus }) });
    const ids = (result.products ?? []).map(item => item.id);
    const views = ids.length === 0 ? { products: [] } : await callRpc<{ products: Array<{ productId: number; storeStatus: number }> }>('productBusiness', 'getProductStoreStatuses', { storeId, productIds: ids });
    const statusById = new Map((views.products ?? []).map(item => [item.productId, item.storeStatus]));
    const items = (result.products ?? []).map(item => ({ id: item.id, name: item.name, price: Number(item.price), globalStatus: item.status, storeStatus: statusById.get(item.id) ?? 0 })).filter(item => params.storeStatus === undefined || item.storeStatus === params.storeStatus);
    return { items, total: Number(result.total ?? 0), page: result.page, pageSize: result.pageSize };
  },
  async upsertProductStoreStatus(storeId: number, productId: number, status: number) { await callRpc('productAdmin', 'batchSetProductStoreStatus', { storeId, productIds: [productId], status }); },
  async listStoreCustomizations(_storeId: number, params: { page: number; pageSize: number; productId?: number }) {
    const result = await callRpc<{ items: Array<{ id: number; name: string; status: number }>; total: string | number; page: number; pageSize: number }>('productAdmin', 'listCustomizationItems', { ...(params.productId ? { productId: params.productId } : {}), page: params.page, pageSize: params.pageSize });
    const items = await Promise.all((result.items ?? []).map(async item => {
      const options = await callRpc<{ total?: string | number }>('productAdmin', 'listCustomizationOptions', { itemId: item.id, page: 1, pageSize: 1 });
      return { id: item.id, name: item.name, globalStatus: item.status, optionCount: Number(options.total ?? 0) };
    }));
    return { items, total: Number(result.total ?? 0), page: result.page, pageSize: result.pageSize };
  },
  async listStoreCustomizationOptions(storeId: number, customizationId: number, params: { page: number; pageSize: number }) {
    const result = await callRpc<{ options: Array<{ id: number; name: string; price: number; status: number }>; total: string | number; page: number; pageSize: number }>('productAdmin', 'listCustomizationOptions', { itemId: customizationId, page: params.page, pageSize: params.pageSize });
    const ids = (result.options ?? []).map(item => item.id);
    const views = ids.length === 0 ? { options: [] } : await callRpc<{ options: Array<{ optionId: number; storeStatus: number }> }>('productBusiness', 'getCustomizationOptionStoreStatuses', { storeId, optionIds: ids });
    const statusById = new Map((views.options ?? []).map(item => [item.optionId, item.storeStatus]));
    return { items: (result.options ?? []).map(item => ({ id: item.id, name: item.name, price: Number(item.price), globalStatus: item.status, storeStatus: statusById.get(item.id) ?? 0 })), total: Number(result.total ?? 0), page: result.page, pageSize: result.pageSize };
  },
  async upsertCustomizationOptionStoreStatus(storeId: number, optionId: number, status: number) { await callRpc('productAdmin', 'batchSetCustomizationOptionStoreStatus', { storeId, optionIds: [optionId], status }); },
  async listStoreIngredients(storeId: number, params: { page: number; pageSize: number }) {
    const result = await callRpc<{ ingredients?: Array<{ id: number; name: string; unit: string; quantity: number }>; total?: string | number; page?: number; pageSize?: number }>('productAdmin', 'listStoreIngredients', {
      storeId,
      page: params.page,
      pageSize: params.pageSize,
    });
    return {
      items: (result.ingredients ?? []).map(item => ({ id: item.id, name: item.name, unit: item.unit, quantity: Number(item.quantity) })),
      total: Number(result.total ?? 0),
      page: result.page ?? params.page,
      pageSize: result.pageSize ?? params.pageSize,
    };
  },
};
