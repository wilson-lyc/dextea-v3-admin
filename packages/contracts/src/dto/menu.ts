import { z } from 'zod/v4';
import { PaginatedDataSchema } from '../common/pagination.js';

// ─── 实体 ──────────────────────────────────────────────

export const MenuSchema = z.object({
  id: z.number().describe('ID'),
  name: z.string().describe('名称'),
  description: z.string().describe('描述'),
  createdAt: z.string().describe('创建时间'),
  updatedAt: z.string().describe('更新时间'),
});
export type Menu = z.infer<typeof MenuSchema>;

export const MenuGroupSchema = z.object({
  id: z.number().describe('ID'),
  menuId: z.number().describe('菜单ID'),
  name: z.string().describe('名称'),
  sortOrder: z.number().describe('排序'),
  productCount: z.number().describe('商品数'),
  createdAt: z.string().describe('创建时间'),
  updatedAt: z.string().describe('更新时间'),
});
export type MenuGroup = z.infer<typeof MenuGroupSchema>;

export const MenuProductSchema = z.object({
  groupId: z.number().describe('分组ID'),
  productId: z.number().describe('商品ID'),
  productName: z.string().describe('商品名称'),
  price: z.number().describe('价格'),
  status: z.number().describe('状态'),
  sortOrder: z.number().describe('排序'),
  createdAt: z.string().describe('创建时间'),
  updatedAt: z.string().describe('更新时间'),
});
export type MenuProduct = z.infer<typeof MenuProductSchema>;

export const MenuStoreSchema = z.object({
  id: z.number().describe('ID'),
  name: z.string().describe('名称'),
  province: z.string().describe('省'),
  city: z.string().describe('市'),
  district: z.string().describe('区/县'),
  address: z.string().describe('详细地址'),
  status: z.number().describe('状态'),
  businessHours: z.string().describe('营业时间'),
  phone: z.string().describe('手机号'),
  longitude: z.number().describe('经度'),
  latitude: z.number().describe('纬度'),
  account: z.string().describe('登录账号'),
  email: z.string().describe('邮箱'),
  createdAt: z.string().describe('创建时间'),
  updatedAt: z.string().describe('更新时间'),
});
export type MenuStore = z.infer<typeof MenuStoreSchema>;

// ─── DTO：菜单 ──────────────────────────────────────────

export const MenuListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('每页条数'),
});
export type MenuListRequest = z.infer<typeof MenuListRequestSchema>;

export const MenuListResponseSchema = PaginatedDataSchema(MenuSchema);
export type MenuListResponse = z.infer<typeof MenuListResponseSchema>;

export const MenuGetResponseSchema = MenuSchema;
export type MenuGetResponse = Menu;

export const CreateMenuRequestSchema = z.object({
  name: z.string().min(1, '菜单名称不能为空').max(32, '菜单名称长度不能超过 32 个字符').describe('名称'),
  description: z.string().max(255, '菜单描述长度不能超过 255 个字符').optional().describe('描述'),
});
export type CreateMenuRequest = z.infer<typeof CreateMenuRequestSchema>;

export const CreateMenuResponseSchema = z.object({ id: z.number() });
export type CreateMenuResponse = z.infer<typeof CreateMenuResponseSchema>;

export const UpdateMenuRequestSchema = z.object({
  name: z.string().min(1, '菜单名称不能为空').max(32, '菜单名称长度不能超过 32 个字符').optional().describe('名称'),
  description: z.string().max(255, '菜单描述长度不能超过 255 个字符').optional().describe('描述'),
});
export type UpdateMenuRequest = z.infer<typeof UpdateMenuRequestSchema>;

export const UpdateMenuResponseSchema = z.object({ id: z.number() });
export type UpdateMenuResponse = z.infer<typeof UpdateMenuResponseSchema>;

export const BatchDeleteMenusRequestSchema = z.object({
  menuIds: z.array(z.number()).min(1, '菜单ID列表不能为空').describe('菜单ID列表'),
});
export type BatchDeleteMenusRequest = z.infer<typeof BatchDeleteMenusRequestSchema>;

// ─── DTO：分组 ──────────────────────────────────────────

export const MenuGroupListResponseSchema = z.array(MenuGroupSchema);
export type MenuGroupListResponse = MenuGroup[];

export const CreateMenuGroupRequestSchema = z.object({
  name: z.string().min(1, '分组名称不能为空').max(32, '分组名称长度不能超过 32 个字符').describe('名称'),
  sortOrder: z.number().optional().describe('排序'),
});
export type CreateMenuGroupRequest = z.infer<typeof CreateMenuGroupRequestSchema>;

export const CreateMenuGroupResponseSchema = z.object({ id: z.number() });
export type CreateMenuGroupResponse = z.infer<typeof CreateMenuGroupResponseSchema>;

export const UpdateMenuGroupRequestSchema = z.object({
  name: z.string().min(1, '分组名称不能为空').max(32, '分组名称长度不能超过 32 个字符').optional().describe('名称'),
  sortOrder: z.number().optional().describe('排序'),
});
export type UpdateMenuGroupRequest = z.infer<typeof UpdateMenuGroupRequestSchema>;

export const UpdateMenuGroupResponseSchema = z.object({ id: z.number() });
export type UpdateMenuGroupResponse = z.infer<typeof UpdateMenuGroupResponseSchema>;

export const BatchDeleteMenuGroupsRequestSchema = z.object({
  groupIds: z.array(z.number()).min(1, '分组ID列表不能为空').describe('分组ID列表'),
});
export type BatchDeleteMenuGroupsRequest = z.infer<typeof BatchDeleteMenuGroupsRequestSchema>;

// ─── DTO：分组商品 ──────────────────────────────────────

export const MenuProductListResponseSchema = z.array(MenuProductSchema);
export type MenuProductListResponse = MenuProduct[];

export const AddMenuProductRequestSchema = z.object({
  productId: z.number().describe('商品ID'),
  sortOrder: z.number().optional().describe('排序'),
});
export type AddMenuProductRequest = z.infer<typeof AddMenuProductRequestSchema>;

export const BatchRemoveMenuProductsRequestSchema = z.object({
  productIds: z.array(z.number()).min(1, '商品ID列表不能为空').describe('商品ID列表'),
});
export type BatchRemoveMenuProductsRequest = z.infer<typeof BatchRemoveMenuProductsRequestSchema>;

export const UpdateMenuProductSortRequestSchema = z.object({
  productId: z.number().describe('商品ID'),
  sortOrder: z.number().describe('排序'),
});
export type UpdateMenuProductSortRequest = z.infer<typeof UpdateMenuProductSortRequestSchema>;

// ─── DTO：门店关联 ──────────────────────────────────────

export const MenuStoreListRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('页码'),
  pageSize: z.coerce.number().int().positive().max(100).default(20).describe('每页条数'),
});
export type MenuStoreListRequest = z.infer<typeof MenuStoreListRequestSchema>;

export const MenuStoreListResponseSchema = PaginatedDataSchema(MenuStoreSchema);
export type MenuStoreListResponse = z.infer<typeof MenuStoreListResponseSchema>;

export const DispatchByAreaRequestSchema = z.object({
  /** 省（必填），后端按 省[/市[/区]] 层级匹配其下所有门店 */
  province: z.string().min(1, '省份不能为空').describe('省'),
  /** 市（可选） */
  city: z.string().optional().describe('市'),
  /** 区/县（可选） */
  district: z.string().optional().describe('区/县'),
});
export type DispatchByAreaRequest = z.infer<typeof DispatchByAreaRequestSchema>;

export const DispatchByAreaResponseSchema = z.object({
  matched: z.number().describe('匹配数量'),
  dispatched: z.number().describe('已分发数量'),
  /** 解析出的区域文本（如「广东省韶关市」） */
  regionName: z.string().describe('区域名称'),
});
export type DispatchByAreaResponse = z.infer<typeof DispatchByAreaResponseSchema>;

export const DispatchByIdRequestSchema = z.object({
  storeIds: z.array(z.number()).min(1, '门店ID列表不能为空').describe('门店ID列表'),
});
export type DispatchByIdRequest = z.infer<typeof DispatchByIdRequestSchema>;

export const DispatchByIdResponseSchema = z.object({
  matched: z.number().describe('匹配数量'),
  dispatched: z.number().describe('已分发数量'),
});
export type DispatchByIdResponse = z.infer<typeof DispatchByIdResponseSchema>;
