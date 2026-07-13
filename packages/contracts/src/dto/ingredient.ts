import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

// 原料状态枚举见 @dextea-admin/contracts/status (INGREDIENT_STATUS)

/** 原料实体 */
export const IngredientSchema = z.object({
  id: z.number(),
  name: z.string(),
  unit: z.string(),
  status: z.number(),
  boundCount: z.number(),
  optionCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Ingredient = z.infer<typeof IngredientSchema>;

/** 原料列表查询 */
export const IngredientListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
});
export type IngredientListRequest = z.infer<typeof IngredientListRequestSchema>;

export const IngredientListResponseSchema = PaginatedDataSchema(IngredientSchema);
export type IngredientListResponse = z.infer<typeof IngredientListResponseSchema>;

/** 原料详情 */
export const IngredientDetailResponseSchema = IngredientSchema;
export type IngredientDetailResponse = Ingredient;

/** 新增原料 */
export const CreateIngredientRequestSchema = z.object({
  name: z.string().min(1, '原料名称不能为空'),
  unit: z.string().min(1, '单位不能为空'),
  status: z.number().optional(),
});
export type CreateIngredientRequest = z.infer<typeof CreateIngredientRequestSchema>;

export const CreateIngredientResponseSchema = z.object({ id: z.number() });
export type CreateIngredientResponse = z.infer<typeof CreateIngredientResponseSchema>;

/** 更新原料 */
export const UpdateIngredientRequestSchema = z.object({
  name: z.string().min(1, '原料名称不能为空').optional(),
  unit: z.string().min(1, '单位不能为空').optional(),
  status: z.number().optional(),
});
export type UpdateIngredientRequest = z.infer<typeof UpdateIngredientRequestSchema>;

export const UpdateIngredientResponseSchema = z.object({ id: z.number() });
export type UpdateIngredientResponse = z.infer<typeof UpdateIngredientResponseSchema>;

/** 更新原料状态 */
export const UpdateIngredientStatusRequestSchema = z.object({ status: z.number() });
export type UpdateIngredientStatusRequest = z.infer<typeof UpdateIngredientStatusRequestSchema>;

/** 原料绑定客制化选项 */
export const IngredientOptionSchema = z.object({
  optionId: z.number(),
  optionName: z.string(),
  customizationName: z.string(),
  quantity: z.number(),
});
export type IngredientOption = z.infer<typeof IngredientOptionSchema>;

export const IngredientOptionListResponseSchema = PaginatedDataSchema(IngredientOptionSchema);
export type IngredientOptionListResponse = z.infer<typeof IngredientOptionListResponseSchema>;

export const BindOptionRequestSchema = z.object({
  optionId: z.number(),
  quantity: z.number().min(0, '用量不能为负数').optional(),
});
export type BindOptionRequest = z.infer<typeof BindOptionRequestSchema>;

export const UpdateOptionQuantityRequestSchema = z.object({
  quantity: z.number().min(0, '用量不能为负数'),
});
export type UpdateOptionQuantityRequest = z.infer<typeof UpdateOptionQuantityRequestSchema>;

/** 原料选项列表（供 SelectPicker 使用） */
export const IngredientOptionSelectSchema = z.object({
  label: z.string(),
  value: z.string(),
  unit: z.string(),
});
export type IngredientOptionSelect = z.infer<typeof IngredientOptionSelectSchema>;

export const IngredientOptionSelectListResponseSchema = z.array(IngredientOptionSelectSchema);
export type IngredientOptionSelectListResponse = IngredientOptionSelect[];

/** 原料绑定的商品（只读查询，不允许原料侧写入） */
export const IngredientProductSchema = z.object({
  productId: z.number(),
  productName: z.string(),
  quantity: z.number(),
  sort: z.number(),
});
export type IngredientProduct = z.infer<typeof IngredientProductSchema>;

export const IngredientProductListResponseSchema = PaginatedDataSchema(IngredientProductSchema);
export type IngredientProductListResponse = z.infer<typeof IngredientProductListResponseSchema>;
