export { http, API_BASE } from './http'

export { login, logout, getMe } from './auth'
export { getInitStatus, initSystem } from './init'
export { getEmployees, createEmployee, updateEmployee, toggleEmployeeStatus } from './employee'
export { getStores, getStore, createStore, updateStore, updateStoreStatus, updateStoreBasicInfo, updateStoreLocation, resetStorePassword, syncStoreLocations } from './store'
export { getProducts, getProductBasicInfo, getProductTags, createProduct, updateProduct, toggleProductStatus, addProductTag, removeProductTag, getProductBoundIngredients, bindIngredientToProduct, updateProductIngredientQuantity, unbindIngredientFromProduct, getProductOptions } from './product'
export { getTags, createTag, updateTag, deleteTag, getTagBoundProducts, bindProductToTag, unbindProductFromTag, getTagOptions } from './tag'
export { getProvinces, getChildren, resolveNames } from './area'
export { getDashboardStats } from './dashboard'
export { getProductCustomizations, getProductCustomization, createProductCustomization, updateProductCustomization, updateProductCustomizationStatus, getCustomizationOptions, createCustomizationOption, updateCustomizationOption, deleteCustomizationOption } from './product-customization'
export { getIngredients, getIngredient, createIngredient, updateIngredient, toggleIngredientStatus, getIngredientBoundProducts, bindProductToIngredient, updateIngredientProductQuantity, unbindProductFromIngredient, getIngredientOptions, getIngredientBoundOptions, bindOptionToIngredient, updateIngredientOptionQuantity, unbindOptionFromIngredient } from './ingredient'
export { getMenus, createMenu, updateMenu, deleteMenu, batchDeleteMenus, getMenu, getMenuGroups, createMenuGroup, deleteMenuGroup, getMenuGroupProducts, bindMenuProduct, batchRemoveMenuProducts, updateMenuProductSort, dispatchMenuByArea, dispatchMenuById, getStoresByMenuId } from './menu'
export { getStoreProducts, updateProductStoreStatus, getStoreCustomizations, getStoreCustomizationOptions, updateCustomizationOptionStoreStatus, getStoreIngredients } from './store-status'

// Re-export shared types for page convenience
export type {
  LoginRequest,
  LoginResponse,
  InitRequest,
  InitStatusData,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateEmployeeResponse,
  UpdateEmployeeResponse,
  ToggleEmployeeStatusResponse,
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
  Menu,
  CreateMenuInput,
  UpdateMenuInput,
  CreateMenuResponse,
  UpdateMenuResponse,
  MenuGroup,
  MenuProduct,
  CreateMenuGroupInput,
  CreateMenuGroupResponse,
  ProductTag,
  CreateTagInput,
  UpdateTagInput,
} from '@dextea/shared-types'
