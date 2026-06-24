// ====== 商品状态（预留） ======
// 'available'=上架  'unavailable'=下架  'deleted'=已删除
// ──────────────────────────────

export type ProductStatus = 'available' | 'unavailable' | 'deleted';

export const PRODUCT_STATUS = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  DELETED: 'deleted',
} as const;

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  available: '上架',
  unavailable: '下架',
  deleted: '已删除',
} as const;
