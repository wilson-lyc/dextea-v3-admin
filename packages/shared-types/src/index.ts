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

// ====== 店铺 ======
export interface Shop {
  id: string;
  name: string;
  address: string;
  status: ShopStatus;
  createdAt: string;
  updatedAt: string;
}

export type ShopStatus = 'active' | 'inactive' | 'closed';

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
