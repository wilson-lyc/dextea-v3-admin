// ====== 订单（预留） ======
// JSON 结构定义，状态类型从 status/ 导入
// ──────────────────────────────

import type { OrderStatus } from '../status/order.js';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  shopId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
