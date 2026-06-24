// ====== 订单状态（预留） ======
// 'pending'=待处理  'confirmed'=已确认  'completed'=已完成  'cancelled'=已取消
// ──────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '待处理',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
} as const;
