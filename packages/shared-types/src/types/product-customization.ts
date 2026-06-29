// ====== 客制化项目 ======
// ──────────────────────────────

import type { ProductCustomizationStatus } from '../status/product-customization.js';

export interface ProductCustomization {
  id: number;
  productId: number;
  name: string;
  status: ProductCustomizationStatus;
  optionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductCustomizationInput {
  productId: number;
  name: string;
}

export interface UpdateProductCustomizationInput {
  name: string;
  status?: ProductCustomizationStatus;
}

export type ProductCustomizationQuery = {
  page?: string;
  pageSize?: string;
  keyword?: string;
  status?: string;
  productId?: string;
};
