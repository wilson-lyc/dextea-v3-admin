// ====== 门店 ======
// 0休息中 1营业中 2筹备中 3门店已注销
export type StoreStatus = 0 | 1 | 2 | 3;

export interface Store {
  id: number;
  name: string;
  province: string;
  city: string;
  district: string;
  address: string;
  status: StoreStatus;
  businessHours: string;
  phone: string;
  longitude: number;
  latitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreInput {
  name: string;
  province: string;
  city: string;
  district: string;
  address: string;
  businessHours: string;
  phone: string;
  longitude?: number;
  latitude?: number;
}

export interface UpdateStoreInput {
  name: string;
  province: string;
  city: string;
  district: string;
  address: string;
  status: StoreStatus;
  businessHours: string;
  phone: string;
  longitude?: number;
  latitude?: number;
}

export interface CreateStoreResponse {
  id: number;
}

export interface UpdateStoreResponse {
  id: number;
}

export interface UpdateStoreStatusRequest {
  status: StoreStatus;
}

export interface UpdateStoreStatusResponse {
  status: StoreStatus;
}

/** Query string shape for GET /stores */
export interface StoreQuery {
  page?: string;
  pageSize?: string;
  keyword?: string;
}
