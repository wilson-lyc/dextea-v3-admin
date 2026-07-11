import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

// ──── 实体 ────

export const StoreProductItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  globalStatus: z.number(),
  storeStatus: z.number(),
});
export type StoreProductItem = z.infer<typeof StoreProductItemSchema>;

export const StoreCustomizationItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  globalStatus: z.number(),
  storeStatus: z.number(),
  optionCount: z.number(),
});
export type StoreCustomizationItem = z.infer<typeof StoreCustomizationItemSchema>;

export const StoreCustomizationOptionItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  globalStatus: z.number(),
  storeStatus: z.number(),
});
export type StoreCustomizationOptionItem = z.infer<typeof StoreCustomizationOptionItemSchema>;

export const StoreIngredientItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  unit: z.string(),
  quantity: z.number(),
});
export type StoreIngredientItem = z.infer<typeof StoreIngredientItemSchema>;

// ──── 请求 DTO ────

/** 门店ID参数 */
export const StoreIdParamsSchema = z.object({
  storeId: z.coerce.number().int().positive('门店ID必须为正整数'),
});
export type StoreIdParams = z.infer<typeof StoreIdParamsSchema>;

/** 商品ID参数 */
export const ProductIdParamsSchema = z.object({
  storeId: z.coerce.number().int().positive('门店ID必须为正整数'),
  productId: z.coerce.number().int().positive('商品ID必须为正整数'),
});
export type ProductIdParams = z.infer<typeof ProductIdParamsSchema>;

/** 客制化项目ID参数 */
export const CustomizationIdParamsSchema = z.object({
  storeId: z.coerce.number().int().positive('门店ID必须为正整数'),
  customizationId: z.coerce.number().int().positive('客制化项目ID必须为正整数'),
});
export type CustomizationIdParams = z.infer<typeof CustomizationIdParamsSchema>;

/** 客制化选项ID参数 */
export const CustomizationOptionIdParamsSchema = z.object({
  storeId: z.coerce.number().int().positive('门店ID必须为正整数'),
  optionId: z.coerce.number().int().positive('客制化选项ID必须为正整数'),
});
export type CustomizationOptionIdParams = z.infer<typeof CustomizationOptionIdParamsSchema>;

/** 通用分页查询 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/** 门店商品列表查询 */
export const ProductListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  globalStatus: z.coerce.number().int().min(0).max(1).optional(),
  storeStatus: z.coerce.number().int().min(0).max(1).optional(),
});
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

/** 更新商品门店状态请求体 */
export const UpdateProductStoreStatusBodySchema = z.object({
  status: z.number().int().min(0).max(1, '状态值必须为0或1'),
});
export type UpdateProductStoreStatusBody = z.infer<typeof UpdateProductStoreStatusBodySchema>;

/** 更新客制化选项门店状态请求体 */
export const UpdateOptionStoreStatusBodySchema = z.object({
  status: z.number().int().min(0).max(1, '状态值必须为0或1'),
});
export type UpdateOptionStoreStatusBody = z.infer<typeof UpdateOptionStoreStatusBodySchema>;

// ──── 响应 DTO ────

export const StoreProductListResponseSchema = PaginatedDataSchema(StoreProductItemSchema);
export type StoreProductListResponse = z.infer<typeof StoreProductListResponseSchema>;

export const StoreCustomizationListResponseSchema = PaginatedDataSchema(StoreCustomizationItemSchema);
export type StoreCustomizationListResponse = z.infer<typeof StoreCustomizationListResponseSchema>;

export const StoreCustomizationOptionListResponseSchema = PaginatedDataSchema(StoreCustomizationOptionItemSchema);
export type StoreCustomizationOptionListResponse = z.infer<typeof StoreCustomizationOptionListResponseSchema>;

export const StoreIngredientListResponseSchema = PaginatedDataSchema(StoreIngredientItemSchema);
export type StoreIngredientListResponse = z.infer<typeof StoreIngredientListResponseSchema>;
