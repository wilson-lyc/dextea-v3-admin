import { callRpc } from '@/infrastructure/rpc/client.js';

type Store = {
  id: number; name: string; province: string; city: string; district: string;
  address: string; status: number; businessHours: string; phone: string;
  longitude: number; latitude: number; account: string; email: string;
  createdAt: string; updatedAt: string;
}

export const storeRepository = {
  async getStoreList(page: number, pageSize: number, keyword?: string) {
    return callRpc<{ stores: Store[]; total: string | number; page: number; pageSize: number }>('store', 'listStores', {
      page: Math.max(1, page), pageSize: Math.min(100, Math.max(1, pageSize)), keyword: keyword?.trim() ?? '',
    }).then(result => ({ items: result.stores ?? [], total: Number(result.total ?? 0), page: result.page, pageSize: result.pageSize }))
  },

  async getStoreById(id: number) {
    try { return await callRpc<Store>('store', 'getStore', { id }) } catch { return null }
  },

  async getStoreByAccount(account: string) {
    try { return await callRpc<Store>('store', 'getStoreByAccount', { account }) } catch { return null }
  },

  async createStore(data: {
    name: string; province: string; city: string; district: string; address: string;
    status: number; businessHours: string; phone: string; account?: string;
    email: string; longitude: number; latitude: number; initialPassword: string;
  }) {
    const result = await callRpc<{ store?: Store }>('store', 'createStore', data)
    return Number(result.store?.id ?? 0)
  },

  async updateStoreById(id: number, data: Record<string, unknown>) {
    const profileKeys = ['name', 'phone', 'businessHours', 'email']
    const locationKeys = ['province', 'city', 'district', 'address', 'longitude', 'latitude']
    if (Object.keys(data).some(key => profileKeys.includes(key))) {
      await callRpc('store', 'updateStoreProfile', { id, ...Object.fromEntries(Object.entries(data).filter(([key]) => profileKeys.includes(key))) })
    }
    if (Object.keys(data).some(key => locationKeys.includes(key))) {
      await callRpc('store', 'updateStoreLocation', { id, ...Object.fromEntries(Object.entries(data).filter(([key]) => locationKeys.includes(key))) })
    }
    if ('status' in data) await callRpc('store', 'updateStoreStatus', { id, status: data.status })
  },

  async getAllStoreLocations() {
    const result = await callRpc<{ stores: Store[] }>('store', 'listStores', { page: 1, pageSize: 100 })
    return (result.stores ?? []).map(store => ({ id: store.id, longitude: store.longitude, latitude: store.latitude }))
  },
};
