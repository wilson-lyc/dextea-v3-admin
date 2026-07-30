import { defineStatus } from './factory.js'

const _customization = defineStatus(
  {
    DISABLED: { key: 'disabled', label: '禁用', value: 0 },
    ACTIVE: { key: 'active', label: '激活', value: 1 },
  } as const,
  { 0: 'destructive', 1: 'green' },
)

export const CUSTOMIZATION_STATUS = _customization.items
export type CustomizationStatusItem = typeof _customization.Item
export type CustomizationStatus = typeof _customization.Value
export const CUSTOMIZATION_STATUS_VALUES = _customization.values
export const CUSTOMIZATION_STATUS_LABEL = _customization.label
export const CUSTOMIZATION_STATUS_TEXT_CLASSES = _customization.textClasses
export const CUSTOMIZATION_STATUS_BADGE_CLASSES = _customization.badgeClasses
