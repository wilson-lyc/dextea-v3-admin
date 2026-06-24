// ====== 商品 ======
// JSON 结构定义，状态类型从 status/ 导入
// ──────────────────────────────

import type { ProductStatus } from '../status/product.js';

export interface Product {
  id: number;
  name: string;
  brief: string;
  description: string;
  status: ProductStatus;
  price: number;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}
