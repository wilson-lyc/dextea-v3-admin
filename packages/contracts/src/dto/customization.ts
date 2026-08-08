import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

// ─── 实体 Schema ──────────────────────────────────

export const CustomizationOptionSchema = z.object({
  id: z.number().describe('ID'),
  customizationId: z.number().describe('客制化项目ID'),
  name: z.string().describe('名称'),
  price: z.number().describe('加价'),
  sort: z.number().describe('排序'),
  status: z.number().describe('状态（0=禁用 1=激活）'),
  ingredientId: z.number().nullable().describe('原料ID'),
  ingredientName: z.string().describe('原料名称'),
  quantity: z.number().describe('用量'),
  createdAt: z.string().describe('创建时间'),
  updatedAt: z.string().describe('更新时间'),
});
export type CustomizationOption = z.infer<typeof CustomizationOptionSchema>;

export const CustomizationSchema = z.object({
  id: z.number().describe('ID'),
  productId: z.number().describe('商品ID'),
  name: z.string().describe('名称'),
  sort: z.number().describe('排序'),
  status: z.number().describe('状态（0=禁用 1=激活）'),
  optionCount: z.number().optional().describe('选项数量'),
  activeOptionCount: z.number().optional(),
  disabledOptionCount: z.number().optional(),
  createdAt: z.string().describe('创建时间'),
  updatedAt: z.string().describe('更新时间'),
});
export type Customization = z.infer<typeof CustomizationSchema>;

// ─── 客制化项目列表 ───────────────────────────────

export const CustomizationListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('每页条数'),
  keyword: z.string().optional().describe('关键字'),
  status: z.coerce.number().int().optional().describe('状态（0=禁用 1=激活）'),
  productId: z.coerce.number().int().optional().describe('商品ID'),
});
export type CustomizationListRequest = z.infer<typeof CustomizationListRequestSchema>;

export const CustomizationListResponseSchema = PaginatedDataSchema(CustomizationSchema);
export type CustomizationListResponse = z.infer<typeof CustomizationListResponseSchema>;

// ─── 创建客制化项目 ───────────────────────────────

export const CreateCustomizationRequestSchema = z.object({
  productId: z.number().int().positive('商品ID必须为正整数').describe('商品ID'),
  name: z.string().trim().min(1, '客制化项目名称不能为空').max(32, '客制化项目名称长度不能超过 32 个字符').describe('名称'),
  sort: z.number().int().min(0).max(127).optional().describe('排序'),
});
export type CreateCustomizationRequest = z.infer<typeof CreateCustomizationRequestSchema>;

export const CreateCustomizationResponseSchema = CustomizationSchema;
export type CreateCustomizationResponse = Customization;

// ─── 更新客制化项目基础信息 ───────────────────────

export const UpdateCustomizationRequestSchema = z.object({
  name: z.string().trim().min(1, '客制化项目名称不能为空').max(32, '客制化项目名称长度不能超过 32 个字符').describe('名称'),
  sort: z.number().int().min(0).max(127).optional().describe('排序'),
  status: z.number().optional().describe('状态（0=禁用 1=激活）'),
});
export type UpdateCustomizationRequest = z.infer<typeof UpdateCustomizationRequestSchema>;

export const UpdateCustomizationResponseSchema = CustomizationSchema;
export type UpdateCustomizationResponse = Customization;

// ─── 单独更新客制化项目状态 ───────────────────────

export const UpdateCustomizationStatusRequestSchema = z.object({
  status: z.number().describe('状态（0=禁用 1=激活）'),
});
export type UpdateCustomizationStatusRequest = z.infer<typeof UpdateCustomizationStatusRequestSchema>;

export const UpdateCustomizationStatusResponseSchema = CustomizationSchema;
export type UpdateCustomizationStatusResponse = Customization;

// ─── 批量更新客制化项目状态 ───────────────────────

export const BatchUpdateCustomizationStatusRequestSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '至少需要一个客制化项目ID').describe('客制化项目ID列表'),
  status: z.number().describe('状态（0=禁用 1=激活）'),
});
export type BatchUpdateCustomizationStatusRequest = z.infer<typeof BatchUpdateCustomizationStatusRequestSchema>;

export const BatchUpdateCustomizationStatusResponseSchema = z.object({
  updatedCount: z.number().describe('更新成功的客制化项目数量'),
});
export type BatchUpdateCustomizationStatusResponse = z.infer<typeof BatchUpdateCustomizationStatusResponseSchema>;

// ─── 获取客制化选项列表（无分页） ─────────────────

export const CustomizationOptionListResponseSchema = z.array(CustomizationOptionSchema);
export type CustomizationOptionListResponse = CustomizationOption[];

// ─── 创建客制化选项 ───────────────────────────────

export const CreateCustomizationOptionRequestSchema = z.object({
  name: z.string().trim().min(1, '客制化选项名称不能为空').max(32, '客制化选项名称长度不能超过 32 个字符').describe('名称'),
  price: z.number().optional().describe('加价'),
  sort: z.number().int().min(0).max(127).optional().describe('排序'),
  ingredientId: z.number().int().positive().nullable().optional().describe('原料ID'),
  quantity: z.number().optional().describe('用量'),
});
export type CreateCustomizationOptionRequest = z.infer<typeof CreateCustomizationOptionRequestSchema>;

export const CreateCustomizationOptionResponseSchema = CustomizationOptionSchema;
export type CreateCustomizationOptionResponse = CustomizationOption;

// ─── 更新客制化选项基础信息 ───────────────────────
// 仅处理名称/加价/排序，状态由下方独立接口维护。

export const UpdateCustomizationOptionRequestSchema = z.object({
  name: z.string().trim().min(1, '客制化选项名称不能为空').max(32, '客制化选项名称长度不能超过 32 个字符').optional().describe('名称'),
  price: z.number().optional().describe('加价'),
  sort: z.number().int().min(0).max(127).optional().describe('排序'),
});
export type UpdateCustomizationOptionRequest = z.infer<typeof UpdateCustomizationOptionRequestSchema>;

export const UpdateCustomizationOptionResponseSchema = CustomizationOptionSchema;
export type UpdateCustomizationOptionResponse = CustomizationOption;

// ─── 单独更新客制化选项状态（激活/禁用） ──

export const UpdateCustomizationOptionStatusRequestSchema = z.object({
  status: z.number().describe('状态（0=禁用 1=激活）'),
});
export type UpdateCustomizationOptionStatusRequest = z.infer<typeof UpdateCustomizationOptionStatusRequestSchema>;

export const UpdateCustomizationOptionStatusResponseSchema = CustomizationOptionSchema;
export type UpdateCustomizationOptionStatusResponse = CustomizationOption;

// ─── 批量更新客制化选项状态（激活/禁用） ──

export const BatchUpdateCustomizationOptionStatusRequestSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '至少需要一个客制化选项ID').describe('客制化选项ID列表'),
  status: z.number().describe('状态（0=禁用 1=激活）'),
});
export type BatchUpdateCustomizationOptionStatusRequest = z.infer<typeof BatchUpdateCustomizationOptionStatusRequestSchema>;

export const BatchUpdateCustomizationOptionStatusResponseSchema = z.object({
  updatedCount: z.number().describe('更新成功的客制化选项数量'),
});
export type BatchUpdateCustomizationOptionStatusResponse = z.infer<typeof BatchUpdateCustomizationOptionStatusResponseSchema>;

// ─── 单独更新客制化选项绑定用量 ───────────────────

export const UpdateCustomizationOptionQuantityRequestSchema = z.object({
  quantity: z.number().describe('用量'),
});
export type UpdateCustomizationOptionQuantityRequest = z.infer<typeof UpdateCustomizationOptionQuantityRequestSchema>;

export const UpdateCustomizationOptionQuantityResponseSchema = CustomizationOptionSchema;
export type UpdateCustomizationOptionQuantityResponse = CustomizationOption;

// ─── 换绑客制化选项原料（可换绑到新原料或解绑） ──
// 换绑到具体原料时须一并提交新用量；解绑（ingredientId 为 null）时用量重置为 0。

export const RebindCustomizationOptionIngredientRequestSchema = z.object({
  ingredientId: z.number().int().positive().nullable().describe('原料ID'),
  quantity: z.number().describe('用量'),
});
export type RebindCustomizationOptionIngredientRequest = z.infer<typeof RebindCustomizationOptionIngredientRequestSchema>;

export const RebindCustomizationOptionIngredientResponseSchema = CustomizationOptionSchema;
export type RebindCustomizationOptionIngredientResponse = CustomizationOption;

// ─── 客制化配置导出 ───────────────────────────────
// 导出的内容只保留可复用的核心字段：项目名称、选项名称/价格/排序。
// 客制化项目本身不导出排序，仅保留客制化选项的排序。

export const CustomizationExportOptionSchema = z.object({
  name: z.string().describe('选项名称'),
  price: z.number().describe('加价'),
  sort: z.number().int().describe('排序'),
});
export type CustomizationExportOption = z.infer<typeof CustomizationExportOptionSchema>;

export const CustomizationExportItemSchema = z.object({
  name: z.string().describe('客制化项目名称'),
  options: z.array(CustomizationExportOptionSchema).describe('客制化选项列表'),
});
export type CustomizationExportItem = z.infer<typeof CustomizationExportItemSchema>;

export const ExportCustomizationResponseSchema = z.object({
  productId: z.number().describe('来源商品ID'),
  items: z.array(CustomizationExportItemSchema).describe('客制化配置'),
});
export type ExportCustomizationResponse = z.infer<typeof ExportCustomizationResponseSchema>;

export const ExportCustomizationRequestSchema = z.object({
  productId: z.number().int().positive('商品ID必须为正整数').describe('来源商品ID'),
  ids: z.array(z.number().int().positive()).min(1, '至少需要选择一个客制化项目').describe('要导出的客制化项目ID列表'),
});
export type ExportCustomizationRequest = z.infer<typeof ExportCustomizationRequestSchema>;

// ─── 客制化配置导入 ───────────────────────────────
// 导入到目标商品，复用的字段只有项目名称、选项名称/价格/排序；
// 导入后项目和选项状态全部默认为禁用。

export const CustomizationImportOptionSchema = z.object({
  name: z.string().trim().min(1, '客制化选项名称不能为空').max(32, '客制化选项名称长度不能超过 32 个字符').describe('选项名称'),
  price: z.number().optional().describe('加价'),
  sort: z.number().int().min(0).max(127).optional().describe('排序'),
});
export type CustomizationImportOption = z.infer<typeof CustomizationImportOptionSchema>;

export const CustomizationImportItemSchema = z.object({
  name: z.string().trim().min(1, '客制化项目名称不能为空').max(32, '客制化项目名称长度不能超过 32 个字符').describe('项目名称'),
  sort: z.number().int().min(0).max(127).optional().describe('排序'),
  options: z.array(CustomizationImportOptionSchema).min(1, '每个客制化项目至少需要一个选项').describe('选项列表'),
});
export type CustomizationImportItem = z.infer<typeof CustomizationImportItemSchema>;

export const ImportCustomizationRequestSchema = z.object({
  productId: z.number().int().positive('商品ID必须为正整数').describe('目标商品ID'),
  items: z.array(CustomizationImportItemSchema).min(1, '至少需要一个客制化项目').describe('客制化配置'),
});
export type ImportCustomizationRequest = z.infer<typeof ImportCustomizationRequestSchema>;

export const ImportCustomizationResponseSchema = z.object({
  importedItemCount: z.number().describe('导入成功的客制化项目数量'),
  importedOptionCount: z.number().describe('导入成功的客制化选项数量'),
});
export type ImportCustomizationResponse = z.infer<typeof ImportCustomizationResponseSchema>;
