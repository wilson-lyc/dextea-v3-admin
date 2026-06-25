// ====== 客制化项目 ======
// ──────────────────────────────

import type { ProductCustomizationStatus } from '../status/product-customization.js';

export interface ProductCustomization {
  id: number;
  name: string;
  displayName: string;
  status: ProductCustomizationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductCustomizationInput {
  name: string;
  displayName: string;
}

export interface UpdateProductCustomizationInput {
  name: string;
  displayName: string;
}

export type ProductCustomizationQuery = {
  page?: string;
  pageSize?: string;
};
