export const ORDER_PAYMENT_STATUS = {
  PENDING: { key: 'pending', label: '支付中', value: 0 },
  PAID: { key: 'paid', label: '已支付', value: 1 },
  REFUNDING: { key: 'refunding', label: '退款中', value: 2 },
  REFUNDED: { key: 'refunded', label: '已退款', value: 3 },
} as const;

export type OrderPaymentStatusItem = (typeof ORDER_PAYMENT_STATUS)[keyof typeof ORDER_PAYMENT_STATUS];

export type OrderPaymentStatus = OrderPaymentStatusItem['value'];

export const ORDER_PAYMENT_STATUS_VALUES: readonly OrderPaymentStatus[] = Object.values(
  ORDER_PAYMENT_STATUS,
).map((s) => s.value);

export const ORDER_PAYMENT_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(ORDER_PAYMENT_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

export const ORDER_PAYMENT_STATUS_TEXT_CLASSES: Record<number, string> = {
  [ORDER_PAYMENT_STATUS.PENDING.value]: 'text-amber-600 dark:text-amber-400',
  [ORDER_PAYMENT_STATUS.PAID.value]: 'text-green-600 dark:text-green-400',
  [ORDER_PAYMENT_STATUS.REFUNDING.value]: 'text-blue-600 dark:text-blue-400',
  [ORDER_PAYMENT_STATUS.REFUNDED.value]: 'text-muted-foreground',
};

export const ORDER_PAYMENT_STATUS_BADGE_CLASSES: Record<number, string> = {
  [ORDER_PAYMENT_STATUS.PENDING.value]:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-200 dark:ring-amber-800/30',
  [ORDER_PAYMENT_STATUS.PAID.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
  [ORDER_PAYMENT_STATUS.REFUNDING.value]:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-200 dark:ring-blue-800/30',
  [ORDER_PAYMENT_STATUS.REFUNDED.value]: 'bg-muted text-muted-foreground ring-muted',
};

export const ORDER_PAYMENT_METHOD = {
  ALIPAY: { key: 'alipay', label: '支付宝', value: 0 },
  WEIXIN: { key: 'weixin', label: '微信', value: 1 },
} as const;

export type OrderPaymentMethodItem = (typeof ORDER_PAYMENT_METHOD)[keyof typeof ORDER_PAYMENT_METHOD];

export type OrderPaymentMethod = OrderPaymentMethodItem['value'];

export const ORDER_PAYMENT_METHOD_VALUES: readonly OrderPaymentMethod[] = Object.values(
  ORDER_PAYMENT_METHOD,
).map((s) => s.value);

export const ORDER_PAYMENT_METHOD_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(ORDER_PAYMENT_METHOD).map((s) => [s.value, s.label]),
) as Record<number, string>;

export const ORDER_PAYMENT_METHOD_TEXT_CLASSES: Record<number, string> = {
  [ORDER_PAYMENT_METHOD.ALIPAY.value]: 'text-blue-600 dark:text-blue-400',
  [ORDER_PAYMENT_METHOD.WEIXIN.value]: 'text-green-600 dark:text-green-400',
};

export const ORDER_PAYMENT_METHOD_BADGE_CLASSES: Record<number, string> = {
  [ORDER_PAYMENT_METHOD.ALIPAY.value]:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-200 dark:ring-blue-800/30',
  [ORDER_PAYMENT_METHOD.WEIXIN.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};

export const ORDER_MAKING_STATUS = {
  PENDING: { key: 'pending', label: '待制作', value: 0 },
  PREPARING: { key: 'preparing', label: '制作中', value: 1 },
  READY: { key: 'ready', label: '制作完成', value: 2 },
  COLLECTED: { key: 'collected', label: '已取餐', value: 3 },
} as const;

export type OrderMakingStatusItem = (typeof ORDER_MAKING_STATUS)[keyof typeof ORDER_MAKING_STATUS];

export type OrderMakingStatus = OrderMakingStatusItem['value'];

export const ORDER_MAKING_STATUS_VALUES: readonly OrderMakingStatus[] = Object.values(
  ORDER_MAKING_STATUS,
).map((s) => s.value);

export const ORDER_MAKING_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(ORDER_MAKING_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

export const ORDER_MAKING_STATUS_TEXT_CLASSES: Record<number, string> = {
  [ORDER_MAKING_STATUS.PENDING.value]: 'text-amber-600 dark:text-amber-400',
  [ORDER_MAKING_STATUS.PREPARING.value]: 'text-blue-600 dark:text-blue-400',
  [ORDER_MAKING_STATUS.READY.value]: 'text-green-600 dark:text-green-400',
  [ORDER_MAKING_STATUS.COLLECTED.value]: 'text-muted-foreground',
};

export const ORDER_MAKING_STATUS_BADGE_CLASSES: Record<number, string> = {
  [ORDER_MAKING_STATUS.PENDING.value]:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-200 dark:ring-amber-800/30',
  [ORDER_MAKING_STATUS.PREPARING.value]:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-200 dark:ring-blue-800/30',
  [ORDER_MAKING_STATUS.READY.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
  [ORDER_MAKING_STATUS.COLLECTED.value]: 'bg-muted text-muted-foreground ring-muted',
};

export const ORDER_SOURCE = {
  OFFLINE: { key: 'offline', label: '线下点餐', value: 0 },
  ALIPAY: { key: 'alipay', label: '支付宝', value: 1 },
  WEIXIN: { key: 'weixin', label: '微信', value: 2 },
} as const;

export type OrderSourceItem = (typeof ORDER_SOURCE)[keyof typeof ORDER_SOURCE];

export type OrderSource = OrderSourceItem['value'];

export const ORDER_SOURCE_VALUES: readonly OrderSource[] = Object.values(ORDER_SOURCE).map(
  (s) => s.value,
);

export const ORDER_SOURCE_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(ORDER_SOURCE).map((s) => [s.value, s.label]),
) as Record<number, string>;

export const ORDER_SOURCE_TEXT_CLASSES: Record<number, string> = {
  [ORDER_SOURCE.OFFLINE.value]: 'text-muted-foreground',
  [ORDER_SOURCE.ALIPAY.value]: 'text-blue-600 dark:text-blue-400',
  [ORDER_SOURCE.WEIXIN.value]: 'text-green-600 dark:text-green-400',
};

export const ORDER_SOURCE_BADGE_CLASSES: Record<number, string> = {
  [ORDER_SOURCE.OFFLINE.value]: 'bg-muted text-muted-foreground ring-muted',
  [ORDER_SOURCE.ALIPAY.value]:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-200 dark:ring-blue-800/30',
  [ORDER_SOURCE.WEIXIN.value]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30',
};
