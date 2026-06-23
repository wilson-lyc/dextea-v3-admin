// ====== 通用 API 响应 ======
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

// ====== 用户状态 ======
export type UserStatus = 0 | 1;

// ====== 用户 ======
export interface User {
  id: number;
  email: string;
  displayName: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
}

export interface UpdateUserInput {
  email: string;
  displayName: string;
  status: UserStatus;
}

// ====== 门店状态 ======
export type StoreStatus = 0 | 1 | 2 | 3; // 0休息中 1营业中 2筹备中 3门店已注销

// ====== 门店 ======
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

// ====== 商品 ======
export interface Product {
  id: string;
  shopId: string;
  name: string;
  price: number;
  category: ProductCategory;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory = 'coffee' | 'tea' | 'pastry' | 'other';
export type ProductStatus = 'available' | 'unavailable' | 'deleted';

// ====== 订单 ======
export interface Order {
  id: string;
  shopId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
