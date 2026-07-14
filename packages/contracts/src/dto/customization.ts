import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

// ─── 实体 Schema ──────────────────────────────────

export const CustomizationOptionSchema = z.object({
  id: z.number(),
  customizationId: z.number(),
  name: z.string(),
  price: z.number(),
  sort: z.number(),
  status: z.number(),
  ingredientId: z.number().nullable(),
  ingredientName: z.string(),
  quantity: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CustomizationOption = z.infer<typeof CustomizationOptionSchema>;

export const CustomizationSchema = z.object({
  id: z.number(),
  productId: z.number(),
  name: z.string(),
  sort: z.number(),
  status: z.number(),
  optionCount: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Customization = z.infer<typeof CustomizationSchema>;

// ─── 客制化项目列表 ───────────────────────────────

export const CustomizationListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
  status: z.coerce.number().int().optional(),
  productId: z.coerce.number().int().optional(),
});
export type CustomizationListRequest = z.infer<typeof CustomizationListRequestSchema>;

export const CustomizationListResponseSchema = PaginatedDataSchema(CustomizationSchema);
export type CustomizationListResponse = z.infer<typeof CustomizationListResponseSchema>;

// ─── 创建客制化项目 ───────────────────────────────

export const CreateCustomizationRequestSchema = z.object({
  productId: z.number().int().positive('商品ID必须为正整数'),
  name: z.string().min(1, '客制化项目名称不能为空'),
  sort: z.number().int().optional(),
});
export type CreateCustomizationRequest = z.infer<typeof CreateCustomizationRequestSchema>;

export const CreateCustomizationResponseSchema = CustomizationSchema;
export type CreateCustomizationResponse = Customization;

// ─── 更新客制化项目基础信息 ───────────────────────

export const UpdateCustomizationRequestSchema = z.object({
  name: z.string().min(1, '客制化项目名称不能为空'),
  sort: z.number().int().optional(),
  status: z.number().optional(),
});
export type UpdateCustomizationRequest = z.infer<typeof UpdateCustomizationRequestSchema>;

export const UpdateCustomizationResponseSchema = CustomizationSchema;
export type UpdateCustomizationResponse = Customization;

// ─── 单独更新客制化项目状态 ───────────────────────

export const UpdateCustomizationStatusRequestSchema = z.object({
  status: z.number(),
});
export type UpdateCustomizationStatusRequest = z.infer<typeof UpdateCustomizationStatusRequestSchema>;

export const UpdateCustomizationStatusResponseSchema = CustomizationSchema;
export type UpdateCustomizationStatusResponse = Customization;

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

// ─── 更新客制化选项基础信息 ───────────────────────
// 仅处理名称/加价/排序/状态，绑定关系与用量由下方独立接口维护。

export const UpdateCustomizationOptionRequestSchema = z.object({
  name: z.string().min(1, '客制化选项名称不能为空').optional(),
  price: z.number().optional(),
  sort: z.number().int().optional(),
  status: z.number().optional(),
});
export type UpdateCustomizationOptionRequest = z.infer<typeof UpdateCustomizationOptionRequestSchema>;

export const UpdateCustomizationOptionResponseSchema = CustomizationOptionSchema;
export type UpdateCustomizationOptionResponse = CustomizationOption;

// ─── 单独更新客制化选项状态（激活/禁用） ──

export const UpdateCustomizationOptionStatusRequestSchema = z.object({
  status: z.number(),
});
export type UpdateCustomizationOptionStatusRequest = z.infer<typeof UpdateCustomizationOptionStatusRequestSchema>;

export const UpdateCustomizationOptionStatusResponseSchema = CustomizationOptionSchema;
export type UpdateCustomizationOptionStatusResponse = CustomizationOption;

// ─── 单独更新客制化选项绑定用量 ───────────────────

export const UpdateCustomizationOptionQuantityRequestSchema = z.object({
  quantity: z.number(),
});
export type UpdateCustomizationOptionQuantityRequest = z.infer<typeof UpdateCustomizationOptionQuantityRequestSchema>;

export const UpdateCustomizationOptionQuantityResponseSchema = CustomizationOptionSchema;
export type UpdateCustomizationOptionQuantityResponse = CustomizationOption;

// ─── 换绑客制化选项原料（可换绑到新原料或解绑） ──
// 换绑到具体原料时须一并提交新用量；解绑（ingredientId 为 null）时用量重置为 0。

export const RebindCustomizationOptionIngredientRequestSchema = z.object({
  ingredientId: z.number().int().positive().nullable(),
  quantity: z.number(),
});
export type RebindCustomizationOptionIngredientRequest = z.infer<typeof RebindCustomizationOptionIngredientRequestSchema>;

export const RebindCustomizationOptionIngredientResponseSchema = CustomizationOptionSchema;
export type RebindCustomizationOptionIngredientResponse = CustomizationOption;
