import { defineStatus } from './factory.js'

const _customer = defineStatus(
  {
    ACTIVE: { key: 'active', label: '禁用', value: 0 },
    DISABLED: { key: 'disabled', label: '激活', value: 1 },
  } as const,
  { 0: 'destructive', 1: 'green' },
)

export const CUSTOMER_STATUS = _customer.items
export type CustomerStatusItem = typeof _customer.Item
export type CustomerStatus = typeof _customer.Value
export const CUSTOMER_STATUS_VALUES = _customer.values
export const CUSTOMER_STATUS_LABEL = _customer.label
export const CUSTOMER_STATUS_TEXT_CLASSES = _customer.textClasses
export const CUSTOMER_STATUS_BADGE_CLASSES = _customer.badgeClasses
