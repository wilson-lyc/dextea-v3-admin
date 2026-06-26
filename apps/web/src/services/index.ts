export { http, API_BASE } from './http'

export { login, logout, getMe } from './auth'
export { getInitStatus, initSystem } from './init'
export { getUsers, createUser, updateUser, toggleUserStatus } from './user'
export { getStores, getStore, createStore, updateStore, updateStoreStatus, updateStoreBasicInfo, updateStoreLocation, resetStorePassword, syncStoreLocations } from './store'
export { getProducts, getProductBasicInfo, getProductTags, createProduct, updateProduct, toggleProductStatus, addProductTag, removeProductTag, getBoundCustomizations, addProductCustomization, removeProductCustomization, updateProductCustomizationSort } from './product'
export { getTags, createTag, updateTag, deleteTag } from './tag'
export { getProvinces, getChildren, resolveNames } from './area'
export { getDashboardStats } from './dashboard'
export { getProductCustomizations, getProductCustomization, createProductCustomization, updateProductCustomization, getBoundProducts, bindProduct, unbindProduct, updateBoundProductSort, getCustomizationOptions, createCustomizationOption, updateCustomizationOption, deleteCustomizationOption } from './product-customization'
export { getIngredients, getIngredient, createIngredient, updateIngredient, toggleIngredientStatus } from './ingredient'

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
  Ingredient,
  CreateIngredientInput,
  IngredientStatus,
  ProductTag,
  CreateTagInput,
  UpdateTagInput,
} from '@dextea/shared-types'
