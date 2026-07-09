import { z } from 'zod/v4';
import { PaginatedDataSchema } from '@/common/types/index.js';

// ─── 状态枚举 ─────────────────────────────────────

export const PRODUCT_CUSTOMIZATION_STATUS = {
  OFF: { key: 'off', value: 0 },
  ON: { key: 'on', value: 1 },
} as const;

export type ProductCustomizationStatus = (typeof PRODUCT_CUSTOMIZATION_STATUS)[keyof typeof PRODUCT_CUSTOMIZATION_STATUS]['value'];
export const PRODUCT_CUSTOMIZATION_STATUS_VALUES: readonly number[] = [0, 1];

export const CUSTOMIZATION_OPTION_STATUS = {
  OFF: { key: 'off', value: 0 },
  ON: { key: 'on', value: 1 },
} as const;

export type CustomizationOptionStatus = (typeof CUSTOMIZATION_OPTION_STATUS)[keyof typeof CUSTOMIZATION_OPTION_STATUS]['value'];
export const CUSTOMIZATION_OPTION_STATUS_VALUES: readonly number[] = [0, 1];

// ─── 实体 Schema ──────────────────────────────────

export const CustomizationOptionSchema = z.object({
  id: z.number(),
  customizationId: z.number(),
  name: z.string(),
  price: z.number(),
  sort: z.number(),
  status: z.number(),
  ingredientId: z.number().nullable(),
  ingredientName: z.string().nullable(),
  quantity: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CustomizationOption = z.infer<typeof CustomizationOptionSchema>;

export const ProductCustomizationSchema = z.object({
  id: z.number(),
  productId: z.number(),
  name: z.string(),
  status: z.number(),
  optionCount: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProductCustomization = z.infer<typeof ProductCustomizationSchema>;

// ─── 客制化项目列表 ───────────────────────────────

export const ProductCustomizationListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
  status: z.coerce.number().int().optional(),
  productId: z.coerce.number().int().optional(),
});
export type ProductCustomizationListRequest = z.infer<typeof ProductCustomizationListRequestSchema>;

export const ProductCustomizationListResponseSchema = PaginatedDataSchema(ProductCustomizationSchema);
export type ProductCustomizationListResponse = z.infer<typeof ProductCustomizationListResponseSchema>;

// ─── 客制化项目详情 ───────────────────────────────

export const ProductCustomizationGetResponseSchema = ProductCustomizationSchema;
export type ProductCustomizationGetResponse = ProductCustomization;

// ─── 创建客制化项目 ───────────────────────────────

export const CreateProductCustomizationRequestSchema = z.object({
  productId: z.number().int().positive('商品ID必须为正整数'),
  name: z.string().min(1, '客制化项目名称不能为空'),
});
export type CreateProductCustomizationRequest = z.infer<typeof CreateProductCustomizationRequestSchema>;

export const CreateProductCustomizationResponseSchema = ProductCustomizationSchema;
export type CreateProductCustomizationResponse = ProductCustomization;

// ─── 更新客制化项目基础信息 ───────────────────────

export const UpdateProductCustomizationRequestSchema = z.object({
  name: z.string().min(1, '客制化项目名称不能为空'),
  status: z.number().optional(),
});
export type UpdateProductCustomizationRequest = z.infer<typeof UpdateProductCustomizationRequestSchema>;

export const UpdateProductCustomizationResponseSchema = ProductCustomizationSchema;
export type UpdateProductCustomizationResponse = ProductCustomization;

// ─── 单独更新客制化项目状态 ───────────────────────

export const UpdateProductCustomizationStatusRequestSchema = z.object({
  status: z.number(),
});
export type UpdateProductCustomizationStatusRequest = z.infer<typeof UpdateProductCustomizationStatusRequestSchema>;

export const UpdateProductCustomizationStatusResponseSchema = ProductCustomizationSchema;

// ─── 获取客制化选项列表（无分页） ─────────────────

export const CustomizationOptionListResponseSchema = z.array(CustomizationOptionSchema);
export type CustomizationOptionListResponse = CustomizationOption[];

// ─── 创建客制化选项 ───────────────────────────────

export const CreateCustomizationOptionRequestSchema = z.object({
  name: z.string().min(1, '客制化选项名称不能为空'),
  price: z.number().optional(),
  sort: z.number().int().optional(),
  ingredientId: z.number().int().positive().nullable().optional(),
  quantity: z.number().optional(),
});
export type CreateCustomizationOptionRequest = z.infer<typeof CreateCustomizationOptionRequestSchema>;

export const CreateCustomizationOptionResponseSchema = CustomizationOptionSchema;
export type CreateCustomizationOptionResponse = CustomizationOption;

// ─── 更新客制化选项 ───────────────────────────────

export const UpdateCustomizationOptionRequestSchema = z.object({
  name: z.string().min(1, '客制化选项名称不能为空').optional(),
  price: z.number().optional(),
  sort: z.number().int().optional(),
  status: z.number().optional(),
  ingredientId: z.number().int().positive().nullable().optional(),
  quantity: z.number().optional(),
});
export type UpdateCustomizationOptionRequest = z.infer<typeof UpdateCustomizationOptionRequestSchema>;

export const UpdateCustomizationOptionResponseSchema = CustomizationOptionSchema;
export type UpdateCustomizationOptionResponse = CustomizationOption;

// ─── 删除客制化选项 ───────────────────────────────

export const DeleteCustomizationOptionResponseSchema = z.null();
