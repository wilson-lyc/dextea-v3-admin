/**
 * 订单支付状态
 * 0=支付中  1=已支付  2=退款中  3=已退款
 *
 * 状态项统一包含三个字段：
 * - key:   稳定的字符串键（用于序列化/枚举标识）
 * - label: 中文语义（用于界面展示，禁止直接展示数字）
 * - value: 数字值（数据库存储 / 接口传输）
 */
export const ORDER_PAYMENT_STATUS = {
  PENDING: { key: 'pending', label: '支付中', value: 0 },
  PAID: { key: 'paid', label: '已支付', value: 1 },
  REFUNDING: { key: 'refunding', label: '退款中', value: 2 },
  REFUNDED: { key: 'refunded', label: '已退款', value: 3 },
} as const;

/** 单个状态项类型 */
export type OrderPaymentStatusItem = (typeof ORDER_PAYMENT_STATUS)[keyof typeof ORDER_PAYMENT_STATUS];

/** 状态数字值联合类型 */
export type OrderPaymentStatus = OrderPaymentStatusItem['value'];

/** 所有状态值 */
export const ORDER_PAYMENT_STATUS_VALUES: readonly OrderPaymentStatus[] = Object.values(
  ORDER_PAYMENT_STATUS,
).map((s) => s.value);

/** value -> 中文 label 映射 */
export const ORDER_PAYMENT_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(ORDER_PAYMENT_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

// ──── 前端展示样式（视图层，按状态值映射到 Tailwind 类） ────

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

/**
 * 订单支付方式
 * 0=支付宝  1=微信
 */
export const ORDER_PAYMENT_METHOD = {
  ALIPAY: { key: 'alipay', label: '支付宝', value: 0 },
  WEIXIN: { key: 'weixin', label: '微信', value: 1 },
} as const;

/** 单个状态项类型 */
export type OrderPaymentMethodItem = (typeof ORDER_PAYMENT_METHOD)[keyof typeof ORDER_PAYMENT_METHOD];

/** 状态数字值联合类型 */
export type OrderPaymentMethod = OrderPaymentMethodItem['value'];

/** 所有状态值 */
export const ORDER_PAYMENT_METHOD_VALUES: readonly OrderPaymentMethod[] = Object.values(
  ORDER_PAYMENT_METHOD,
).map((s) => s.value);

/** value -> 中文 label 映射 */
export const ORDER_PAYMENT_METHOD_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(ORDER_PAYMENT_METHOD).map((s) => [s.value, s.label]),
) as Record<number, string>;

// ──── 前端展示样式（视图层，按状态值映射到 Tailwind 类） ────

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

/**
 * 订单制作状态
 * 0=待制作  1=制作中  2=制作完成  3=已取餐
 */
export const ORDER_MAKING_STATUS = {
  PENDING: { key: 'pending', label: '待制作', value: 0 },
  PREPARING: { key: 'preparing', label: '制作中', value: 1 },
  READY: { key: 'ready', label: '制作完成', value: 2 },
  COLLECTED: { key: 'collected', label: '已取餐', value: 3 },
} as const;

/** 单个状态项类型 */
export type OrderMakingStatusItem = (typeof ORDER_MAKING_STATUS)[keyof typeof ORDER_MAKING_STATUS];

/** 状态数字值联合类型 */
export type OrderMakingStatus = OrderMakingStatusItem['value'];

/** 所有状态值 */
export const ORDER_MAKING_STATUS_VALUES: readonly OrderMakingStatus[] = Object.values(
  ORDER_MAKING_STATUS,
).map((s) => s.value);

/** value -> 中文 label 映射 */
export const ORDER_MAKING_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(ORDER_MAKING_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;

// ──── 前端展示样式（视图层，按状态值映射到 Tailwind 类） ────

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

/**
 * 订单来源
 * 0=线下点餐  1=支付宝  2=微信
 */
export const ORDER_SOURCE = {
  OFFLINE: { key: 'offline', label: '线下点餐', value: 0 },
  ALIPAY: { key: 'alipay', label: '支付宝', value: 1 },
  WEIXIN: { key: 'weixin', label: '微信', value: 2 },
} as const;

/** 单个状态项类型 */
export type OrderSourceItem = (typeof ORDER_SOURCE)[keyof typeof ORDER_SOURCE];

/** 状态数字值联合类型 */
export type OrderSource = OrderSourceItem['value'];

/** 所有状态值 */
export const ORDER_SOURCE_VALUES: readonly OrderSource[] = Object.values(ORDER_SOURCE).map(
  (s) => s.value,
);

/** value -> 中文 label 映射 */
export const ORDER_SOURCE_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(ORDER_SOURCE).map((s) => [s.value, s.label]),
) as Record<number, string>;

// ──── 前端展示样式（视图层，按状态值映射到 Tailwind 类） ────

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
