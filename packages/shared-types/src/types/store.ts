import type { StoreStatus } from '../status/store.js';

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
  account: string;
  email: string;
  menuId: number | null;
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
  account: string;
  email: string;
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
  initialPassword: string;
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

export interface UpdateStoreBasicInfoRequest {
  name: string;
  phone: string;
  businessHours: string;
  email: string;
}

export interface UpdateStoreBasicInfoResponse {
  id: number;
}

export interface UpdateStoreLocationRequest {
  province: string;
  city: string;
  district: string;
  address: string;
  longitude: number;
  latitude: number;
}

export interface UpdateStoreLocationResponse {
  id: number;
}

export interface ResetStorePasswordResponse {
  newPassword: string;
}

export interface BindStoreMenuRequest {
  menuId: number | null;
}

export interface BindStoreMenuResponse {
  id: number;
  menuId: number | null;
}

/** Query string shape for GET /stores */
export interface StoreQuery {
  page?: string;
  pageSize?: string;
  keyword?: string;
}
