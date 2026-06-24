// ====== 商品（预留） ======
// JSON 结构定义，状态类型从 status/ 导入
// ──────────────────────────────

import type { ProductStatus } from '../status/product.js';

export type ProductCategory = 'coffee' | 'tea' | 'pastry' | 'other';

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
