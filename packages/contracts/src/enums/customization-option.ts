import { defineStatus } from './factory.js'

const _customizationOption = defineStatus(
  {
    GLOBAL_DISABLED: { key: 'global_disabled', label: '全局禁用', value: 0 },
    GLOBAL_ACTIVE: { key: 'global_active', label: '全局激活', value: 1 },
  } as const,
  { 0: 'destructive', 1: 'green' },
)

export const CUSTOMIZATION_OPTION_STATUS = _customizationOption.items
export type CustomizationOptionStatusItem = typeof _customizationOption.Item
export type CustomizationOptionStatus = typeof _customizationOption.Value
export const CUSTOMIZATION_OPTION_STATUS_VALUES = _customizationOption.values
export const CUSTOMIZATION_OPTION_STATUS_LABEL = _customizationOption.label
export const CUSTOMIZATION_OPTION_STATUS_TEXT_CLASSES = _customizationOption.textClasses
export const CUSTOMIZATION_OPTION_STATUS_BADGE_CLASSES = _customizationOption.badgeClasses

const _customizationOptionStore = defineStatus(
  {
    STORE_DISABLED: { key: 'store_disabled', label: '门店禁用', value: 0 },
    STORE_ACTIVE: { key: 'store_active', label: '门店激活', value: 1 },
  } as const,
  { 0: 'destructive', 1: 'green' },
)

export const CUSTOMIZATION_OPTION_STORE_STATUS = _customizationOptionStore.items
export type CustomizationOptionStoreStatusItem = typeof _customizationOptionStore.Item
export type CustomizationOptionStoreStatus = typeof _customizationOptionStore.Value
export const CUSTOMIZATION_OPTION_STORE_STATUS_VALUES = _customizationOptionStore.values
export const CUSTOMIZATION_OPTION_STORE_STATUS_LABEL = _customizationOptionStore.label
export const CUSTOMIZATION_OPTION_STORE_STATUS_TEXT_CLASSES = _customizationOptionStore.textClasses
export const CUSTOMIZATION_OPTION_STORE_STATUS_BADGE_CLASSES = _customizationOptionStore.badgeClasses

export const CUSTOMIZATION_OPTION_STORE_STATUS_ACTION: Record<number, string> = {
  [CUSTOMIZATION_OPTION_STORE_STATUS.STORE_ACTIVE.value]: '禁用',
  [CUSTOMIZATION_OPTION_STORE_STATUS.STORE_DISABLED.value]: '激活',
}
