// ====== 门店商品/客制化状态 & 原料库存 ======
// ──────────────────────────────────────────────

import type { ProductStatus } from '../status/product.js';
import type { ProductCustomizationStatus } from '../status/product-customization.js';
import type { CustomizationOptionStatus } from '../status/customization-option.js';

// ──── 商品门店状态 ────

export interface StoreProductItem {
  id: number;
  name: string;
  price: number;
  globalStatus: ProductStatus;
  storeStatus: ProductStatus;
}

export interface UpsertProductStoreStatusRequest {
  status: ProductStatus;
}

// ──── 客制化项目门店状态 ────

export interface StoreCustomizationItem {
  id: number;
  name: string;
  globalStatus: ProductCustomizationStatus;
  storeStatus: ProductCustomizationStatus;
  optionCount: number;
}

export interface StoreCustomizationOptionItem {
  id: number;
  name: string;
  price: number;
  globalStatus: CustomizationOptionStatus;
  storeStatus: CustomizationOptionStatus;
}

export interface UpsertCustomizationOptionStoreStatusRequest {
  status: CustomizationOptionStatus;
}

// ──── 原料门店库存 ────

export interface StoreIngredientItem {
  id: number;
  name: string;
  unit: string;
  quantity: number;
}
