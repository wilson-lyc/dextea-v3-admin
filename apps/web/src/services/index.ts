export { http, API_BASE } from './http'

export { login, logout, getMe } from './auth'
export { getInitStatus, initSystem } from './init'
export { getUsers, createUser, updateUser, toggleUserStatus } from './user'
export { getStores, getStore, createStore, updateStore, updateStoreStatus, updateStoreBasicInfo, updateStoreLocation, resetStorePassword, syncStoreLocations } from './store'
export { getProducts, getProductBasicInfo, getProductTags, createProduct, updateProduct, toggleProductStatus, addProductTag, removeProductTag, getBoundCustomizations, addProductCustomization, removeProductCustomization } from './product'
export { getTags, createTag, updateTag, deleteTag } from './tag'
export { getProvinces, getChildren, resolveNames } from './area'
export { getDashboardStats } from './dashboard'
export { getProductCustomizations, getProductCustomization, createProductCustomization, getBoundProducts, bindProduct, unbindProduct, getCustomizationOptions, createCustomizationOption, updateCustomizationOption, deleteCustomizationOption } from './product-customization'

// Re-export shared types for page convenience
export type {
  LoginRequest,
  LoginResponse,
  InitRequest,
  InitStatusData,
  CreateUserInput,
  UpdateUserInput,
  CreateUserResponse,
  UpdateUserResponse,
  ToggleUserStatusResponse,
  CreateStoreInput,
  UpdateStoreInput,
  CreateStoreResponse,
  UpdateStoreResponse,
  UpdateStoreStatusRequest,
  UpdateStoreStatusResponse,
  Division,
  AmapConfig,
  DashboardStats,
  ProductTag,
  CreateTagInput,
  UpdateTagInput,
} from '@dextea/shared-types'
