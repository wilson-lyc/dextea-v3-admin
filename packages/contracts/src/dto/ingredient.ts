import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

// 原料状态枚举见 @dextea-admin/contracts/status (INGREDIENT_STATUS)

/** 原料实体 */
export const IngredientSchema = z.object({
  id: z.number().describe('ID'),
  name: z.string().describe('名称'),
  unit: z.string().describe('单位'),
  status: z.number().describe('状态（0=禁用 1=激活）'),
  boundCount: z.number().describe('已绑定数量'),
  optionCount: z.number().describe('选项数量'),
  createdAt: z.string().describe('创建时间'),
  updatedAt: z.string().describe('更新时间'),
});
export type Ingredient = z.infer<typeof IngredientSchema>;

/** 原料列表查询 */
export const IngredientListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('每页条数'),
  keyword: z.string().optional().describe('关键字'),
});
export type IngredientListRequest = z.infer<typeof IngredientListRequestSchema>;

export const IngredientListResponseSchema = PaginatedDataSchema(IngredientSchema);
export type IngredientListResponse = z.infer<typeof IngredientListResponseSchema>;

/** 原料详情 */
export const IngredientDetailResponseSchema = IngredientSchema;
export type IngredientDetailResponse = Ingredient;

/** 新增原料 */
export const CreateIngredientRequestSchema = z.object({
  name: z.string().min(1, '原料名称不能为空').describe('名称'),
  unit: z.string().min(1, '单位不能为空').describe('单位'),
  status: z.number().optional().describe('状态（0=禁用 1=激活）'),
});
export type CreateIngredientRequest = z.infer<typeof CreateIngredientRequestSchema>;

export const CreateIngredientResponseSchema = z.object({ id: z.number() });
export type CreateIngredientResponse = z.infer<typeof CreateIngredientResponseSchema>;

/** 更新原料 */
export const UpdateIngredientRequestSchema = z.object({
  name: z.string().min(1, '原料名称不能为空').optional().describe('名称'),
  unit: z.string().min(1, '单位不能为空').optional().describe('单位'),
  status: z.number().optional().describe('状态（0=禁用 1=激活）'),
});
export type UpdateIngredientRequest = z.infer<typeof UpdateIngredientRequestSchema>;

export const UpdateIngredientResponseSchema = z.object({ id: z.number() });
export type UpdateIngredientResponse = z.infer<typeof UpdateIngredientResponseSchema>;

/** 更新原料状态 */
export const UpdateIngredientStatusRequestSchema = z.object({ status: z.number() });
export type UpdateIngredientStatusRequest = z.infer<typeof UpdateIngredientStatusRequestSchema>;

/** 原料绑定客制化选项 */
export const IngredientOptionSchema = z.object({
  optionId: z.number().describe('选项ID'),
  optionName: z.string().describe('选项名称'),
  customizationName: z.string().describe('客制化项目名称'),
  quantity: z.number().describe('用量'),
});
export type IngredientOption = z.infer<typeof IngredientOptionSchema>;

export const IngredientOptionListResponseSchema = PaginatedDataSchema(IngredientOptionSchema);
export type IngredientOptionListResponse = z.infer<typeof IngredientOptionListResponseSchema>;

/** 原料选项列表（供 SelectPicker 使用） */
export const IngredientOptionSelectSchema = z.object({
  label: z.string().describe('选项标签'),
  value: z.string().describe('选项值'),
  unit: z.string().describe('单位'),
});
export type IngredientOptionSelect = z.infer<typeof IngredientOptionSelectSchema>;

export const IngredientOptionSelectListResponseSchema = z.array(IngredientOptionSelectSchema);
export type IngredientOptionSelectListResponse = IngredientOptionSelect[];

/** 原料绑定的商品（只读查询，不允许原料侧写入） */
export const IngredientProductSchema = z.object({
  productId: z.number().describe('商品ID'),
  productName: z.string().describe('商品名称'),
  quantity: z.number().describe('用量'),
  sort: z.number().describe('排序'),
});
export type IngredientProduct = z.infer<typeof IngredientProductSchema>;

export const IngredientProductListResponseSchema = PaginatedDataSchema(IngredientProductSchema);
export type IngredientProductListResponse = z.infer<typeof IngredientProductListResponseSchema>;
