import { z } from 'zod/v4';
import { PaginatedDataSchema } from '@/common/types/index.js';

// ─── 商品状态枚举 ───────────────────────────────────

export const PRODUCT_STATUS = {
  OFF: { key: 'off', value: 0 },
  ON: { key: 'on', value: 1 },
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS]['value'];

export const PRODUCT_STATUS_VALUES: readonly ProductStatus[] = [0, 1];

// ─── 实体 ───────────────────────────────────────────

export const TagSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type Tag = z.infer<typeof TagSchema>;

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  brief: z.string(),
  description: z.string(),
  status: z.number(),
  price: z.number(),
  tags: z.array(TagSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Product = z.infer<typeof ProductSchema>;

export const ProductBasicInfoSchema = z.object({
  id: z.number(),
  name: z.string(),
  brief: z.string(),
  description: z.string(),
  status: z.number(),
  price: z.number(),
  tags: z.array(TagSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProductBasicInfo = z.infer<typeof ProductBasicInfoSchema>;

export const IngredientRelationSchema = z.object({
  ingredientId: z.number(),
  ingredientName: z.string(),
  unit: z.string(),
  quantity: z.number(),
});
export type IngredientRelation = z.infer<typeof IngredientRelationSchema>;

export const ProductOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});
export type ProductOption = z.infer<typeof ProductOptionSchema>;

// ─── 商品列表 ───────────────────────────────────────

export const ProductListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
  status: z.string().optional(),
  priceMin: z.string().optional(),
  priceMax: z.string().optional(),
  tagIds: z.string().optional(),
});
export type ProductListRequest = z.infer<typeof ProductListRequestSchema>;

export const ProductListResponseSchema = PaginatedDataSchema(ProductSchema);
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;

// ─── 商品基础信息 ───────────────────────────────────

export const ProductBasicInfoResponseSchema = ProductBasicInfoSchema;
export type ProductBasicInfoResponse = ProductBasicInfo;

// ─── 新增商品 ───────────────────────────────────────

export const CreateProductRequestSchema = z.object({
  name: z.string().min(1, '商品名称不能为空'),
  brief: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  status: z.number().optional(),
  tagIds: z.array(z.number()).optional(),
});
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

export const CreateProductResponseSchema = z.object({
  id: z.number(),
});
export type CreateProductResponse = z.infer<typeof CreateProductResponseSchema>;

// ─── 更新商品 ───────────────────────────────────────

export const UpdateProductRequestSchema = z.object({
  name: z.string().optional(),
  brief: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  status: z.number().optional(),
});
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

export const UpdateProductResponseSchema = ProductBasicInfoSchema;
export type UpdateProductResponse = ProductBasicInfo;

// ─── 上下架商品 ─────────────────────────────────────

export const UpdateProductStatusRequestSchema = z.object({
  status: z.number(),
});
export type UpdateProductStatusRequest = z.infer<typeof UpdateProductStatusRequestSchema>;

export const UpdateProductStatusResponseSchema = ProductBasicInfoSchema;
export type UpdateProductStatusResponse = ProductBasicInfo;

// ─── 商品标签列表 ───────────────────────────────────

export const ProductTagListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type ProductTagListRequest = z.infer<typeof ProductTagListRequestSchema>;

export const ProductTagListResponseSchema = PaginatedDataSchema(TagSchema);
export type ProductTagListResponse = z.infer<typeof ProductTagListResponseSchema>;

// ─── 批量绑定标签 ───────────────────────────────────

export const BindTagsRequestSchema = z.object({
  tagIds: z.array(z.number()).min(1, '至少需要一个标签ID'),
});
export type BindTagsRequest = z.infer<typeof BindTagsRequestSchema>;

// ─── 批量解绑标签 ───────────────────────────────────

export const UnbindTagsRequestSchema = z.object({
  tagIds: z.array(z.number()).min(1, '至少需要一个标签ID'),
});
export type UnbindTagsRequest = z.infer<typeof UnbindTagsRequestSchema>;

// ─── 商品原料列表 ───────────────────────────────────

export const ProductIngredientListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type ProductIngredientListRequest = z.infer<typeof ProductIngredientListRequestSchema>;

export const ProductIngredientListResponseSchema = PaginatedDataSchema(IngredientRelationSchema);
export type ProductIngredientListResponse = z.infer<typeof ProductIngredientListResponseSchema>;

// ─── 绑定原料 ───────────────────────────────────────

export const BindIngredientRequestSchema = z.object({
  ingredientId: z.number(),
  quantity: z.number().optional(),
});
export type BindIngredientRequest = z.infer<typeof BindIngredientRequestSchema>;

// ─── 更新原料用量 ───────────────────────────────────

export const UpdateIngredientQuantityRequestSchema = z.object({
  quantity: z.number(),
});
export type UpdateIngredientQuantityRequest = z.infer<typeof UpdateIngredientQuantityRequestSchema>;

// ─── 商品选项列表 ───────────────────────────────────

export const ProductOptionListResponseSchema = z.array(ProductOptionSchema);
export type ProductOptionListResponse = z.infer<typeof ProductOptionListResponseSchema>;
