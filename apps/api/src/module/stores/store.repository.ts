import { status as grpcStatus } from '@grpc/grpc-js';
import { callRpc } from '@/infrastructure/rpc/client.js';

type Store = {
  id: number; name: string; province: string; city: string; district: string;
  address: string; status: number; businessHours: string; phone: string;
  longitude: number; latitude: number; account: string; email: string;
  createdAt: string; updatedAt: string;
}

function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error &&
    (error as { code?: unknown }).code === grpcStatus.NOT_FOUND;
}

export const storeRepository = {
  async getStoreList(page: number, pageSize: number, keyword?: string) {
    return callRpc<{ stores: Store[]; total: string | number; page: number; pageSize: number }>('storeAdmin', 'listStores', {
      page: Math.max(1, page), pageSize: Math.min(100, Math.max(1, pageSize)), keyword: keyword?.trim() ?? '',
    }).then(result => ({ items: result.stores ?? [], total: Number(result.total ?? 0), page: result.page, pageSize: result.pageSize }))
  },

  async getStoreById(id: number) {
    try { return await callRpc<Store>('storeAdmin', 'getStore', { id }) } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  },

  async getStoreByAccount(account: string) {
    try { return await callRpc<Store>('storeAdmin', 'getStoreByAccount', { account }) } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  },

  async createStore(data: {
    name: string; province: string; city: string; district: string; address: string;
    status: number; businessHours: string; phone: string; account?: string;
    email: string; longitude: number; latitude: number;
  }) {
    const result = await callRpc<{ store?: Store; initialPassword?: string }>('storeAdmin', 'createStore', data)
    return {
      id: Number(result.store?.id ?? 0),
      initialPassword: result.initialPassword ?? '',
    }
  },

  async updateStoreById(id: number, data: Record<string, unknown>) {
    const profileKeys = ['name', 'phone', 'businessHours', 'email']
    const locationKeys = ['province', 'city', 'district', 'address', 'longitude', 'latitude']
    if (Object.keys(data).some(key => profileKeys.includes(key))) {
      await callRpc('storeAdmin', 'updateStoreProfile', { id, ...Object.fromEntries(Object.entries(data).filter(([key]) => profileKeys.includes(key))) })
    }
    if (Object.keys(data).some(key => locationKeys.includes(key))) {
      await callRpc('storeAdmin', 'updateStoreLocation', { id, ...Object.fromEntries(Object.entries(data).filter(([key]) => locationKeys.includes(key))) })
    }
    if ('status' in data) await callRpc('storeAdmin', 'updateStoreStatus', { id, status: data.status })
  },

  async getAllStoreLocations() {
    const pageSize = 100
    const first = await callRpc<{ stores: Store[]; total: string | number }>('storeAdmin', 'listStores', { page: 1, pageSize })
    const stores = [...(first.stores ?? [])]
    const totalPages = Math.ceil(Number(first.total ?? stores.length) / pageSize)
    for (let page = 2; page <= totalPages; page += 1) {
      const result = await callRpc<{ stores: Store[] }>('storeAdmin', 'listStores', { page, pageSize })
      stores.push(...(result.stores ?? []))
    }
    return stores.map(store => ({ id: store.id, longitude: store.longitude, latitude: store.latitude }))
  },
};
