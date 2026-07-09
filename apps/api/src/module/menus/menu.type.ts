import { z } from 'zod/v4';
import { PaginatedDataSchema } from '@/common/types/index.js';

// ─── 实体 ──────────────────────────────────────────────

export const MenuSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Menu = z.infer<typeof MenuSchema>;

export const MenuGroupSchema = z.object({
  id: z.number(),
  menuId: z.number(),
  name: z.string(),
  sortOrder: z.number(),
  productCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MenuGroup = z.infer<typeof MenuGroupSchema>;

export const MenuProductSchema = z.object({
  groupId: z.number(),
  productId: z.number(),
  productName: z.string(),
  price: z.number(),
  status: z.number(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MenuProduct = z.infer<typeof MenuProductSchema>;

export const MenuStoreSchema = z.object({
  id: z.number(),
  name: z.string(),
  province: z.string(),
  city: z.string(),
  district: z.string(),
  address: z.string(),
  status: z.number(),
  businessHours: z.string(),
  phone: z.string(),
  longitude: z.number(),
  latitude: z.number(),
  account: z.string(),
  email: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MenuStore = z.infer<typeof MenuStoreSchema>;

// ─── DTO：菜单 ──────────────────────────────────────────

export const MenuListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type MenuListRequest = z.infer<typeof MenuListRequestSchema>;

export const MenuListResponseSchema = PaginatedDataSchema(MenuSchema);
export type MenuListResponse = z.infer<typeof MenuListResponseSchema>;

export const MenuGetResponseSchema = MenuSchema;
export type MenuGetResponse = Menu;

export const CreateMenuRequestSchema = z.object({
  name: z.string().min(1, '菜单名称不能为空'),
  description: z.string().optional(),
});
export type CreateMenuRequest = z.infer<typeof CreateMenuRequestSchema>;

export const CreateMenuResponseSchema = z.object({
  id: z.number(),
});
export type CreateMenuResponse = z.infer<typeof CreateMenuResponseSchema>;

export const UpdateMenuRequestSchema = z.object({
  name: z.string().min(1, '菜单名称不能为空').optional(),
  description: z.string().optional(),
});
export type UpdateMenuRequest = z.infer<typeof UpdateMenuRequestSchema>;

export const UpdateMenuResponseSchema = z.object({
  id: z.number(),
});
export type UpdateMenuResponse = z.infer<typeof UpdateMenuResponseSchema>;

export const BatchDeleteMenusRequestSchema = z.object({
  menuIds: z.array(z.number()).min(1, '菜单ID列表不能为空'),
});
export type BatchDeleteMenusRequest = z.infer<typeof BatchDeleteMenusRequestSchema>;

// ─── DTO：分组 ──────────────────────────────────────────

export const MenuGroupListResponseSchema = z.array(MenuGroupSchema);
export type MenuGroupListResponse = MenuGroup[];

export const CreateMenuGroupRequestSchema = z.object({
  name: z.string().min(1, '分组名称不能为空'),
  sortOrder: z.number().optional(),
});
export type CreateMenuGroupRequest = z.infer<typeof CreateMenuGroupRequestSchema>;

export const CreateMenuGroupResponseSchema = z.object({
  id: z.number(),
});
export type CreateMenuGroupResponse = z.infer<typeof CreateMenuGroupResponseSchema>;

export const UpdateMenuGroupRequestSchema = z.object({
  name: z.string().min(1, '分组名称不能为空').optional(),
  sortOrder: z.number().optional(),
});
export type UpdateMenuGroupRequest = z.infer<typeof UpdateMenuGroupRequestSchema>;

export const UpdateMenuGroupResponseSchema = z.object({
  id: z.number(),
});
export type UpdateMenuGroupResponse = z.infer<typeof UpdateMenuGroupResponseSchema>;

export const BatchDeleteMenuGroupsRequestSchema = z.object({
  groupIds: z.array(z.number()).min(1, '分组ID列表不能为空'),
});
export type BatchDeleteMenuGroupsRequest = z.infer<typeof BatchDeleteMenuGroupsRequestSchema>;

// ─── DTO：分组商品 ──────────────────────────────────────

export const MenuProductListResponseSchema = z.array(MenuProductSchema);
export type MenuProductListResponse = MenuProduct[];

export const AddMenuProductRequestSchema = z.object({
  productId: z.number(),
  sortOrder: z.number().optional(),
});
export type AddMenuProductRequest = z.infer<typeof AddMenuProductRequestSchema>;

export const BatchRemoveMenuProductsRequestSchema = z.object({
  productIds: z.array(z.number()).min(1, '商品ID列表不能为空'),
});
export type BatchRemoveMenuProductsRequest = z.infer<typeof BatchRemoveMenuProductsRequestSchema>;

export const UpdateMenuProductSortRequestSchema = z.object({
  productId: z.number(),
  sortOrder: z.number(),
});
export type UpdateMenuProductSortRequest = z.infer<typeof UpdateMenuProductSortRequestSchema>;

// ─── DTO：门店关联 ──────────────────────────────────────

export const MenuStoreListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type MenuStoreListRequest = z.infer<typeof MenuStoreListRequestSchema>;

export const MenuStoreListResponseSchema = PaginatedDataSchema(MenuStoreSchema);
export type MenuStoreListResponse = z.infer<typeof MenuStoreListResponseSchema>;

export const DispatchByAreaRequestSchema = z.object({
  province: z.string().min(1, '省份不能为空'),
  city: z.string().optional(),
  district: z.string().optional(),
});
export type DispatchByAreaRequest = z.infer<typeof DispatchByAreaRequestSchema>;

export const DispatchByAreaResponseSchema = z.object({
  matched: z.number(),
  dispatched: z.number(),
});
export type DispatchByAreaResponse = z.infer<typeof DispatchByAreaResponseSchema>;

export const DispatchByIdRequestSchema = z.object({
  storeIds: z.array(z.number()).min(1, '门店ID列表不能为空'),
});
export type DispatchByIdRequest = z.infer<typeof DispatchByIdRequestSchema>;

export const DispatchByIdResponseSchema = z.object({
  matched: z.number(),
  dispatched: z.number(),
});
export type DispatchByIdResponse = z.infer<typeof DispatchByIdResponseSchema>;
