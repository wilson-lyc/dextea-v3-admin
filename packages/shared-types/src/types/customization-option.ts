// ====== 客制化选项 ======
// ──────────────────────────────

import type { CustomizationOptionStatus } from '../status/customization-option.js';

export interface CustomizationOption {
  id: number;
  customizationId: number;
  name: string;
  price: number;
  sort: number;
  status: CustomizationOptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomizationOptionInput {
  name: string;
  price?: number;
  sort?: number;
}

export interface UpdateCustomizationOptionInput {
  name?: string;
  price?: number;
  sort?: number;
  status?: CustomizationOptionStatus;
}
