/**
 * ErrorCode 层 — 业务错误码与消息定义
 *
 * 所有错误码统一使用 1xx+++ 格式（1 + 模块序号 + 模块内序号）：
 *   10000-10099  系统级通用错误 (00)
 *   10100-10199  认证模块 (01)
 *   10200-10299  用户管理 (02)
 *   10300-10399  门店管理 (03)
 *   10400-10499  地区服务 (04)
 *   10500-10599  系统初始化 (05)
 *   10600-10699  系统配置 (06)
 *   10700-10799  商品标签 (07)
 *   10800-10899  商品管理 (08)
 *   10900-10999  客制化项目 (09)
 *   11000-11099  原料管理 (10)
 *   11100-11199  菜单管理 (11)
 *   11200-11299  门店状态管理 (12)
 */

export { SystemErrorCodes } from '@/module/system/system.errorcode.js';
export { AuthErrorCodes } from '@/module/auth/auth.errorcode.js';
export { EmployeeErrorCodes } from '@/module/employees/employees.errorcode.js';
export { StoreErrorCodes } from '@/module/stores/store.errorcode.js';
export { AreaErrorCodes } from '@/module/areas/area.errorcode.js';
export { InitErrorCodes } from '@/module/init/init.errorcode.js';
export { ConfigErrorCodes } from '@/module/config/config.errorcode.js';
export { ProductErrorCodes } from '@/module/products/product.errorcode.js';
export { TagErrorCodes } from '@/module/tags/tag.errorcode.js';
export { ProductCustomizationErrorCodes } from '@/module/product-customizations/product-customization.errorcode.js';
export { IngredientErrorCodes } from '@/module/ingredients/ingredient.errorcode.js';
export { MenuErrorCodes } from '@/module/menus/menu.errorcode.js';
export { StoreStatusErrorCodes } from '@/module/store-status/store-status.errorcode.js';
