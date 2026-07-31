import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';
import { TagSimpleSchema } from './tag.js';

// ─── 商品状态枚举见 @dextea-admin/contracts/status (PRODUCT_STATUS) ───

/** 商品实体 */
export const ProductSchema = z.object({
  id: z.number().describe('ID'),
  name: z.string().describe('名称'),
  brief: z.string().describe('简介'),
  description: z.string().describe('描述'),
  status: z.number().describe('状态（0=全局下架 1=全局上架）'),
  price: z.number().describe('价格'),
  tags: z.array(TagSimpleSchema).optional().describe('标签列表'),
  createdAt: z.string().describe('创建时间'),
  updatedAt: z.string().describe('更新时间'),
});
export type Product = z.infer<typeof ProductSchema>;

export const ProductBasicInfoSchema = z.object({
  id: z.number().describe('ID'),
  name: z.string().describe('名称'),
  brief: z.string().describe('简介'),
  description: z.string().describe('描述'),
  status: z.number().describe('状态（0=全局下架 1=全局上架）'),
  price: z.number().describe('价格'),
  tags: z.array(TagSimpleSchema).optional().describe('标签列表'),
  createdAt: z.string().describe('创建时间'),
  updatedAt: z.string().describe('更新时间'),
});
export type ProductBasicInfo = z.infer<typeof ProductBasicInfoSchema>;

export const IngredientRelationSchema = z.object({
  ingredientId: z.number().describe('原料ID'),
  ingredientName: z.string().describe('原料名称'),
  unit: z.string().describe('单位'),
  quantity: z.number().describe('用量'),
  sort: z.number().describe('排序'),
});
export type IngredientRelation = z.infer<typeof IngredientRelationSchema>;

export const ProductOptionSchema = z.object({
  label: z.string().describe('选项标签'),
  value: z.string().describe('选项值'),
});
export type ProductOption = z.infer<typeof ProductOptionSchema>;

// 可选数值：空串/ null 视为未传（避免空串被 z.coerce.number() 转成 0）
const optionalCoerceNumber = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.coerce.number().optional(),
);

/** 商品列表 */
export const ProductListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('每页条数'),
  keyword: z.string().optional().describe('关键字'),
  status: optionalCoerceNumber.describe('状态（0=全局下架 1=全局上架）'),
  priceMin: optionalCoerceNumber.describe('最低价'),
  priceMax: optionalCoerceNumber.describe('最高价'),
  tagIds: z.string().optional().describe('标签ID列表'),
});
export type ProductListRequest = z.infer<typeof ProductListRequestSchema>;

export const ProductListResponseSchema = PaginatedDataSchema(ProductSchema);
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;

/** 商品基础信息 */
export const ProductBasicInfoResponseSchema = ProductBasicInfoSchema;
export type ProductBasicInfoResponse = ProductBasicInfo;

/** 新增商品 */
export const CreateProductRequestSchema = z.object({
  name: z.string().min(1, '商品名称不能为空').max(64, '商品名称长度不能超过 64 个字符').describe('名称'),
  brief: z.string().max(64, '简介长度不能超过 64 个字符').optional().describe('简介'),
  description: z.string().max(500, '描述长度不能超过 500 个字符').optional().describe('描述'),
  price: z.number().min(0, '价格不能为负数').max(999999, '价格不能超过 999999').optional().describe('价格'),
  status: z.number().optional().describe('状态（0=全局下架 1=全局上架）'),
});
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

export const CreateProductResponseSchema = z.object({ id: z.number() });
export type CreateProductResponse = z.infer<typeof CreateProductResponseSchema>;

/** 更新商品 */
export const UpdateProductRequestSchema = z.object({
  name: z.string().max(64, '商品名称长度不能超过 64 个字符').optional().describe('名称'),
  brief: z.string().max(64, '简介长度不能超过 64 个字符').optional().describe('简介'),
  description: z.string().max(500, '描述长度不能超过 500 个字符').optional().describe('描述'),
  price: z.number().min(0, '价格不能为负数').max(999999, '价格不能超过 999999').optional().describe('价格'),
  status: z.number().optional().describe('状态（0=全局下架 1=全局上架）'),
});
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

export const UpdateProductResponseSchema = ProductBasicInfoSchema;
export type UpdateProductResponse = ProductBasicInfo;

/** 上下架商品 */
export const UpdateProductStatusRequestSchema = z.object({ status: z.number() });
export type UpdateProductStatusRequest = z.infer<typeof UpdateProductStatusRequestSchema>;

export const UpdateProductStatusResponseSchema = ProductBasicInfoSchema;
export type UpdateProductStatusResponse = ProductBasicInfo;

/** 商品标签列表 */
export const ProductTagListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('每页条数'),
});
export type ProductTagListRequest = z.infer<typeof ProductTagListRequestSchema>;

export const ProductTagListResponseSchema = PaginatedDataSchema(TagSimpleSchema);
export type ProductTagListResponse = z.infer<typeof ProductTagListResponseSchema>;

/** 批量绑定标签 */
export const BindTagsRequestSchema = z.object({
  tagIds: z.array(z.number()).min(1, '至少需要一个标签ID').describe('标签ID列表'),
});
export type BindTagsRequest = z.infer<typeof BindTagsRequestSchema>;

/** 批量解绑标签 */
export const UnbindTagsRequestSchema = z.object({
  tagIds: z.array(z.number()).min(1, '至少需要一个标签ID').describe('标签ID列表'),
});
export type UnbindTagsRequest = z.infer<typeof UnbindTagsRequestSchema>;

/** 商品原料列表 */
export const ProductIngredientListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('每页条数'),
});
export type ProductIngredientListRequest = z.infer<typeof ProductIngredientListRequestSchema>;

export const ProductIngredientListResponseSchema = PaginatedDataSchema(IngredientRelationSchema);
export type ProductIngredientListResponse = z.infer<typeof ProductIngredientListResponseSchema>;

/** 绑定原料 */
export const BindIngredientRequestSchema = z.object({
  ingredientId: z.number().describe('原料ID'),
  quantity: z.number().min(0, '用量不能为负数').optional().describe('用量'),
  sort: z.number().int().min(0, '排序不能为负数').optional().describe('排序'),
});
export type BindIngredientRequest = z.infer<typeof BindIngredientRequestSchema>;

/** 更新原料用量 */
export const UpdateIngredientQuantityRequestSchema = z.object({
  quantity: z.number().min(0, '用量不能为负数').describe('用量'),
});
export type UpdateIngredientQuantityRequest = z.infer<typeof UpdateIngredientQuantityRequestSchema>;

/** 更新原料在商品中的排序 */
export const UpdateIngredientSortRequestSchema = z.object({
  sort: z.number().int().min(0, '排序不能为负数').describe('排序'),
});
export type UpdateIngredientSortRequest = z.infer<typeof UpdateIngredientSortRequestSchema>;

/** 商品选项列表 */
export const ProductOptionListResponseSchema = z.array(ProductOptionSchema);
export type ProductOptionListResponse = z.infer<typeof ProductOptionListResponseSchema>;

// ─── 商品图片（封面图 + 图库，统一存放于 product_images 表） ───

/** 图片实体（复用图片资源池字段，前端可直接用于 <img src>） */
export const ProductImageSchema = z.object({
  id: z.number().describe('ID'),
  url: z.string().describe('图片地址'),
  createdAt: z.string().describe('创建时间'),
});
export type ProductImage = z.infer<typeof ProductImageSchema>;

/** 获取商品图片 */
export const GetProductImagesResponseSchema = z.object({
  /** 封面图（允许为空，商品可暂时不设置封面） */
  cover: ProductImageSchema.nullable().describe('封面图'),
  /** 图库图片（按 sort 升序） */
  gallery: z.array(ProductImageSchema).describe('图库图片'),
});
export type GetProductImagesResponse = z.infer<typeof GetProductImagesResponseSchema>;

/** 设置商品图片（全量替换：封面临时可为空，图库最多 10 张） */
export const SetProductImagesRequestSchema = z.object({
  /** 封面图资源 ID；传 null 表示清除封面 */
  coverImageId: z.number().int().positive().nullable().describe('封面图资源ID'),
  /** 图库图片资源 ID 列表，最多 10 张 */
  galleryImageIds: z.array(z.number().int().positive()).max(10, '图库最多 10 张').describe('图库图片ID列表'),
});
export type SetProductImagesRequest = z.infer<typeof SetProductImagesRequestSchema>;

/** 设置商品图片响应（返回保存后的最新图片） */
export const SetProductImagesResponseSchema = GetProductImagesResponseSchema;
export type SetProductImagesResponse = z.infer<typeof SetProductImagesResponseSchema>;
