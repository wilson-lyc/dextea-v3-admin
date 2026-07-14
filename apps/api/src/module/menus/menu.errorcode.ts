import type { BizErrorCode } from '@/common/types';

/**
 * 菜单管理错误码 (11100-11199)
 */
export const MenuErrorCodes = {
  MENU_NOT_FOUND: { code: 11100, message: '菜单不存在' },
  LIST_FAILED: { code: 11101, message: '获取菜单列表失败' },
  CREATE_FAILED: { code: 11102, message: '新建菜单失败' },
  UPDATE_FAILED: { code: 11103, message: '更新菜单失败' },
  DELETE_FAILED: { code: 11104, message: '删除菜单失败' },
  GROUP_NOT_FOUND: { code: 11105, message: '菜单分组不存在' },
  GROUP_CREATE_FAILED: { code: 11106, message: '新建菜单分组失败' },
  GROUP_UPDATE_FAILED: { code: 11107, message: '更新菜单分组失败' },
  GROUP_DELETE_FAILED: { code: 11108, message: '删除菜单分组失败' },
  PRODUCT_BIND_FAILED: { code: 11109, message: '绑定商品到分组失败' },
  NAME_REQUIRED: { code: 11110, message: '请输入菜单名称' },
  LIST_GROUPS_FAILED: { code: 11111, message: '获取菜单分组列表失败' },
  LIST_PRODUCTS_FAILED: { code: 11112, message: '获取分组商品列表失败' },
  PRODUCT_ALREADY_BOUND: { code: 11113, message: '该商品已在此分组中' },
  DESCRIPTION_TOO_LONG: { code: 11114, message: '菜单描述不能超过500个字符' },
  PRODUCT_NOT_BOUND: { code: 11115, message: '分组中不存在该商品' },
  PRODUCT_SORT_UPDATE_FAILED: { code: 11116, message: '更新商品排序失败' },
  PRODUCT_BATCH_UNBIND_FAILED: { code: 11117, message: '批量解绑商品失败' },
  GROUP_BATCH_DELETE_FAILED: { code: 11118, message: '批量删除分组失败' },
  MENU_IN_USE: { code: 11119, message: '该菜单已被门店绑定，无法删除' },
  INVALID_REGION_CODE: { code: 11120, message: '无效的区域代码' },
  DISPATCH_AREA_FAILED: { code: 11121, message: '按地域分发菜单失败' },
  NO_MATCHED_STORES: { code: 11122, message: '指定区域内没有找到门店' },
  DISPATCH_ID_FAILED: { code: 11123, message: '按ID分发菜单失败' },
  STORE_ALREADY_BOUND: { code: 11124, message: '门店已绑定该菜单，无法重复绑定' },
} as const satisfies Record<string, BizErrorCode>;
