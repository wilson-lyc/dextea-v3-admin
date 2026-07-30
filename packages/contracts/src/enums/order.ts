import { defineStatus } from './factory.js'

const _payment = defineStatus(
  {
    PENDING: { key: 'pending', label: '支付中', value: 0 },
    PAID: { key: 'paid', label: '已支付', value: 1 },
    REFUNDING: { key: 'refunding', label: '退款中', value: 2 },
    REFUNDED: { key: 'refunded', label: '已退款', value: 3 },
  } as const,
  { 0: 'amber', 1: 'green', 2: 'blue', 3: 'muted' },
)

export const ORDER_PAYMENT_STATUS = _payment.items
export type OrderPaymentStatusItem = typeof _payment.Item
export type OrderPaymentStatus = typeof _payment.Value
export const ORDER_PAYMENT_STATUS_VALUES = _payment.values
export const ORDER_PAYMENT_STATUS_LABEL = _payment.label
export const ORDER_PAYMENT_STATUS_TEXT_CLASSES = _payment.textClasses
export const ORDER_PAYMENT_STATUS_BADGE_CLASSES = _payment.badgeClasses

const _paymentMethod = defineStatus(
  {
    CASH: { key: 'cash', label: '现金', value: 0 },
    ALIPAY: { key: 'alipay', label: '支付宝', value: 1 },
    WEIXIN: { key: 'weixin', label: '微信', value: 2 },
  } as const,
  { 0: 'muted', 1: 'blue', 2: 'green' },
)

export const ORDER_PAYMENT_METHOD = _paymentMethod.items
export type OrderPaymentMethodItem = typeof _paymentMethod.Item
export type OrderPaymentMethod = typeof _paymentMethod.Value
export const ORDER_PAYMENT_METHOD_VALUES = _paymentMethod.values
export const ORDER_PAYMENT_METHOD_LABEL = _paymentMethod.label

const _making = defineStatus(
  {
    PENDING: { key: 'pending', label: '待制作', value: 0 },
    PREPARING: { key: 'preparing', label: '制作中', value: 1 },
    READY: { key: 'ready', label: '制作完成', value: 2 },
    COLLECTED: { key: 'collected', label: '已取餐', value: 3 },
  } as const,
  { 0: 'amber', 1: 'blue', 2: 'green', 3: 'muted' },
)

export const ORDER_MAKING_STATUS = _making.items
export type OrderMakingStatusItem = typeof _making.Item
export type OrderMakingStatus = typeof _making.Value
export const ORDER_MAKING_STATUS_VALUES = _making.values
export const ORDER_MAKING_STATUS_LABEL = _making.label
export const ORDER_MAKING_STATUS_TEXT_CLASSES = _making.textClasses
export const ORDER_MAKING_STATUS_BADGE_CLASSES = _making.badgeClasses

const _source = defineStatus(
  {
    OFFLINE: { key: 'offline', label: '线下点餐', value: 0 },
    ALIPAY: { key: 'alipay', label: '支付宝', value: 1 },
    WEIXIN: { key: 'weixin', label: '微信', value: 2 },
  } as const,
  { 0: 'muted', 1: 'blue', 2: 'green' },
)

export const ORDER_SOURCE = _source.items
export type OrderSourceItem = typeof _source.Item
export type OrderSource = typeof _source.Value
export const ORDER_SOURCE_VALUES = _source.values
export const ORDER_SOURCE_LABEL = _source.label
