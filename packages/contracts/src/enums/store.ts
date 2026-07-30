import { defineStatus } from './factory.js'

const _store = defineStatus(
  {
    CLOSED: { key: 'closed', label: '休息中', value: 0 },
    OPEN: { key: 'open', label: '营业中', value: 1 },
    PENDING: { key: 'pending', label: '筹备中', value: 2 },
    DEFUNCT: { key: 'defunct', label: '已注销', value: 3 },
  } as const,
  { 0: 'red', 1: 'green', 2: 'blue', 3: 'muted' },
)

export const STORE_STATUS = _store.items
export type StoreStatusItem = typeof _store.Item
export type StoreStatus = typeof _store.Value
export const STORE_STATUS_VALUES = _store.values
export const STORE_STATUS_LABEL = _store.label
export const STORE_STATUS_TEXT_CLASSES = _store.textClasses
export const STORE_STATUS_BADGE_CLASSES = _store.badgeClasses
