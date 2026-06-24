// ====== 商品（预留） ======

export type ProductCategory = 'coffee' | 'tea' | 'pastry' | 'other';
export type ProductStatus = 'available' | 'unavailable' | 'deleted';

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
