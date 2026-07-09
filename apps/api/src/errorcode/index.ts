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

export { SystemErrorCodes } from './system.js';
export { AuthErrorCodes } from './auth.js';
export { EmployeeErrorCodes } from './employees.js';
export { StoreErrorCodes } from './stores.js';
export { AreaErrorCodes } from './areas.js';
export { InitErrorCodes } from './init.js';
export { ConfigErrorCodes } from './config.js';
export { ProductErrorCodes } from './products.js';
export { TagErrorCodes } from './tags.js';
export { ProductCustomizationErrorCodes } from './product-customizations.js';
export { IngredientErrorCodes } from './ingredients.js';
export { MenuErrorCodes } from './menus.js';
export { StoreStatusErrorCodes } from './store-status.js';
