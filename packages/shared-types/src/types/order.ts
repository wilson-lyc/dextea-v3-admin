// ====== 订单（预留） ======
// ──────────────────────────────

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
  status: number;
  createdAt: string;
  updatedAt: string;
}
