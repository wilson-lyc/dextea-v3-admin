import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

// ──── 实体 ────

export const StoreProductItemSchema = z.object({
  id: z.number().describe('ID'),
  name: z.string().describe('名称'),
  price: z.number().describe('价格'),
  globalStatus: z.number().describe('全局状态（0=下架 1=上架）'),
  storeStatus: z.number().describe('门店状态（0=不可用 1=可用）'),
});
export type StoreProductItem = z.infer<typeof StoreProductItemSchema>;

// 客制化项目不设置门店状态，仅含全局状态与选项数量
export const StoreCustomizationItemSchema = z.object({
  id: z.number().describe('ID'),
  name: z.string().describe('名称'),
  globalStatus: z.number().describe('全局状态（0=下架 1=上架）'),
  optionCount: z.number().describe('选项数量'),
});
export type StoreCustomizationItem = z.infer<typeof StoreCustomizationItemSchema>;

export const StoreCustomizationOptionItemSchema = z.object({
  id: z.number().describe('ID'),
  name: z.string().describe('名称'),
  price: z.number().describe('价格'),
  globalStatus: z.number().describe('全局状态（0=下架 1=上架）'),
  storeStatus: z.number().describe('门店状态（0=不可用 1=可用）'),
});
export type StoreCustomizationOptionItem = z.infer<typeof StoreCustomizationOptionItemSchema>;

export const StoreIngredientItemSchema = z.object({
  id: z.number().describe('ID'),
  name: z.string().describe('名称'),
  unit: z.string().describe('单位'),
  quantity: z.number().describe('用量'),
});
export type StoreIngredientItem = z.infer<typeof StoreIngredientItemSchema>;

// ──── 请求 DTO ────

/** 门店ID参数 */
export const StoreIdParamsSchema = z.object({
  storeId: z.coerce.number().int().positive('门店ID必须为正整数').describe('门店ID'),
});
export type StoreIdParams = z.infer<typeof StoreIdParamsSchema>;

/** 商品ID参数 */
export const ProductIdParamsSchema = z.object({
  storeId: z.coerce.number().int().positive('门店ID必须为正整数').describe('门店ID'),
  productId: z.coerce.number().int().positive('商品ID必须为正整数').describe('商品ID'),
});
export type ProductIdParams = z.infer<typeof ProductIdParamsSchema>;

/** 客制化项目ID参数 */
export const CustomizationIdParamsSchema = z.object({
  storeId: z.coerce.number().int().positive('门店ID必须为正整数').describe('门店ID'),
  customizationId: z.coerce.number().int().positive('客制化项目ID必须为正整数').describe('客制化项目ID'),
});
export type CustomizationIdParams = z.infer<typeof CustomizationIdParamsSchema>;

/** 客制化选项ID参数 */
export const CustomizationOptionIdParamsSchema = z.object({
  storeId: z.coerce.number().int().positive('门店ID必须为正整数').describe('门店ID'),
  optionId: z.coerce.number().int().positive('客制化选项ID必须为正整数').describe('选项ID'),
});
export type CustomizationOptionIdParams = z.infer<typeof CustomizationOptionIdParamsSchema>;

/** 通用分页查询 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('每页条数'),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/** 门店客制化项目列表查询（可按商品过滤） */
export const StoreCustomizationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('每页条数'),
  productId: z.coerce.number().int().positive().optional().describe('商品ID'),
});
export type StoreCustomizationListQuery = z.infer<typeof StoreCustomizationListQuerySchema>;

/** 门店商品列表查询 */
export const ProductListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('每页条数'),
  globalStatus: z.coerce.number().int().min(0).max(1).optional().describe('全局状态（0=下架 1=上架）'),
  storeStatus: z.coerce.number().int().min(0).max(1).optional().describe('门店状态（0=不可用 1=可用）'),
});
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

/** 更新商品门店状态请求体 */
export const UpdateProductStoreStatusBodySchema = z.object({
  status: z.number().int().min(0).max(1, '状态值必须为0或1').describe('状态'),
});
export type UpdateProductStoreStatusBody = z.infer<typeof UpdateProductStoreStatusBodySchema>;

/** 批量更新商品门店状态请求体 */
export const BatchUpdateProductStoreStatusBodySchema = z.object({
  productIds: z
    .array(z.number().int().positive('商品ID必须为正整数'))
    .min(1, '请至少选择一个商品')
    .max(100, '单次最多批量更新100个商品')
    .describe('商品ID列表'),
  status: z.number().int().min(0).max(1, '状态值必须为0或1').describe('状态'),
});
export type BatchUpdateProductStoreStatusBody = z.infer<typeof BatchUpdateProductStoreStatusBodySchema>;

/** 更新客制化选项门店状态请求体 */
export const UpdateOptionStoreStatusBodySchema = z.object({
  status: z.number().int().min(0).max(1, '状态值必须为0或1').describe('状态'),
});
export type UpdateOptionStoreStatusBody = z.infer<typeof UpdateOptionStoreStatusBodySchema>;

/** 批量更新客制化选项门店状态请求体 */
export const BatchUpdateOptionStoreStatusBodySchema = z.object({
  optionIds: z
    .array(z.number().int().positive('选项ID必须为正整数'))
    .min(1, '请至少选择一个选项')
    .max(100, '单次最多批量更新100个选项')
    .describe('客制化选项ID列表'),
  status: z.number().int().min(0).max(1, '状态值必须为0或1').describe('状态'),
});
export type BatchUpdateOptionStoreStatusBody = z.infer<typeof BatchUpdateOptionStoreStatusBodySchema>;

/** 原料ID参数（门店库存） */
export const StoreIngredientParamsSchema = z.object({
  storeId: z.coerce.number().int().positive('门店ID必须为正整数').describe('门店ID'),
  ingredientId: z.coerce.number().int().positive('原料ID必须为正整数').describe('原料ID'),
});
export type StoreIngredientParams = z.infer<typeof StoreIngredientParamsSchema>;

/** 更新门店原料库存请求体 */
export const UpdateStoreIngredientStockBodySchema = z.object({
  quantity: z.number().min(0, '库存不能为负数').describe('用量'),
});
export type UpdateStoreIngredientStockBody = z.infer<typeof UpdateStoreIngredientStockBodySchema>;

// ──── 响应 DTO ────

export const StoreProductListResponseSchema = PaginatedDataSchema(StoreProductItemSchema);
export type StoreProductListResponse = z.infer<typeof StoreProductListResponseSchema>;

export const StoreCustomizationListResponseSchema = PaginatedDataSchema(StoreCustomizationItemSchema);
export type StoreCustomizationListResponse = z.infer<typeof StoreCustomizationListResponseSchema>;

export const StoreCustomizationOptionListResponseSchema = PaginatedDataSchema(StoreCustomizationOptionItemSchema);
export type StoreCustomizationOptionListResponse = z.infer<typeof StoreCustomizationOptionListResponseSchema>;

export const StoreIngredientListResponseSchema = PaginatedDataSchema(StoreIngredientItemSchema);
export type StoreIngredientListResponse = z.infer<typeof StoreIngredientListResponseSchema>;

/** 批量更新商品门店状态响应 */
export const BatchUpdateProductStoreStatusResponseSchema = z.object({
  updatedCount: z.number().describe('成功更新数量'),
});
export type BatchUpdateProductStoreStatusResponse = z.infer<typeof BatchUpdateProductStoreStatusResponseSchema>;

/** 批量更新客制化选项门店状态响应 */
export const BatchUpdateOptionStoreStatusResponseSchema = z.object({
  updatedCount: z.number().describe('成功更新数量'),
});
export type BatchUpdateOptionStoreStatusResponse = z.infer<typeof BatchUpdateOptionStoreStatusResponseSchema>;

/** 更新门店原料库存响应 */
export const UpdateStoreIngredientStockResponseSchema = z.object({
  id: z.number().describe('ID'),
  quantity: z.number().describe('用量'),
});
export type UpdateStoreIngredientStockResponse = z.infer<typeof UpdateStoreIngredientStockResponseSchema>;
