import { defineStatus } from './factory.js'

const _role = defineStatus(
  {
    DISABLED: { key: 'disabled', label: '禁用', value: 0 },
    ACTIVE: { key: 'active', label: '启用', value: 1 },
  } as const,
  { 0: 'destructive', 1: 'green' },
)

export const ROLE_STATUS = _role.items
export type RoleStatusItem = typeof _role.Item
export type RoleStatus = typeof _role.Value
export const ROLE_STATUS_VALUES = _role.values
export const ROLE_STATUS_LABEL = _role.label
export const ROLE_STATUS_TEXT_CLASSES = _role.textClasses
export const ROLE_STATUS_BADGE_CLASSES = _role.badgeClasses
