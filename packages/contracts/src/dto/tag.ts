import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

/** 商品标签（含绑定商品数量） */
export const TagSchema = z.object({
  id: z.number(),
  name: z.string(),
  boundCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Tag = z.infer<typeof TagSchema>;

/** 标签选项（供 SelectPicker 使用） */
export const TagOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});
export type TagOption = z.infer<typeof TagOptionSchema>;

export const TagOptionListResponseSchema = z.array(TagOptionSchema);
export type TagOptionListResponse = TagOption[];

/** 标签简易实体（不含绑定数量） */
export const TagSimpleSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type TagSimple = z.infer<typeof TagSimpleSchema>;

/** 获取标签列表 */
export const TagListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type TagListRequest = z.infer<typeof TagListRequestSchema>;

export const TagListResponseSchema = PaginatedDataSchema(TagSchema);
export type TagListResponse = z.infer<typeof TagListResponseSchema>;

/** 新增标签 */
export const CreateTagRequestSchema = z.object({
  name: z.string().min(1, '标签名称不能为空'),
});
export type CreateTagRequest = z.infer<typeof CreateTagRequestSchema>;

export const CreateTagResponseSchema = TagSimpleSchema;
export type CreateTagResponse = TagSimple;

/** 更新标签 */
export const UpdateTagRequestSchema = z.object({
  name: z.string().min(1, '标签名称不能为空'),
});
export type UpdateTagRequest = z.infer<typeof UpdateTagRequestSchema>;

export const UpdateTagResponseSchema = TagSimpleSchema;
export type UpdateTagResponse = TagSimple;

/** 获取标签绑定的商品列表 */
export const TagProductsRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type TagProductsRequest = z.infer<typeof TagProductsRequestSchema>;

export const TagProductItemSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type TagProductItem = z.infer<typeof TagProductItemSchema>;

export const TagProductsResponseSchema = PaginatedDataSchema(TagProductItemSchema);
export type TagProductsResponse = z.infer<typeof TagProductsResponseSchema>;

/** 批量绑定商品到标签 */
export const BindProductsRequestSchema = z.object({
  productIds: z.array(z.number().int().positive()).min(1, '商品ID列表不能为空'),
});
export type BindProductsRequest = z.infer<typeof BindProductsRequestSchema>;

/** 批量解绑商品标签 */
export const UnbindProductsRequestSchema = z.object({
  productIds: z.array(z.number().int().positive()).min(1, '商品ID列表不能为空'),
});
export type UnbindProductsRequest = z.infer<typeof UnbindProductsRequestSchema>;
