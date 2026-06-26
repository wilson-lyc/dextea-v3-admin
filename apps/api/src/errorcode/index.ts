/**
 * ErrorCode 层 — 业务错误码与消息定义
 *
 * 所有错误码统一使用 1xxxx 格式：
 *   10000-10099  系统级通用错误
 *   10100-10199  认证模块
 *   10200-10299  用户管理
 *   10300-10399  门店管理
 *   10400-10499  地区服务
 *   10500-10599  系统初始化
 *   10600-10699  系统配置
 *   10700-10799  商品标签
 *   10800-10899  商品管理
 *   10900-10999  客制化项目
 *   11000-11099  原料管理
 */

export interface BizError {
  /** 业务错误码 */
  code: number;
  /** 用户可见的错误消息 */
  message: string;
  /** 对应的 HTTP 状态码 */
  httpStatus: number;
}

export class AppError extends Error {
  public readonly code: number;
  public readonly httpStatus: number;

  constructor(bizError: BizError, detail?: string) {
    super(detail ?? bizError.message);
    this.name = 'AppError';
    this.code = bizError.code;
    this.httpStatus = bizError.httpStatus;
  }

  /** 转换为 API 响应体 */
  toResponse() {
    return {
      code: this.code,
      data: null,
      message: this.message,
    };
  }
}

export { systemErrors } from './system.js';
export { authErrors } from './auth.js';
export { userErrors } from './users.js';
export { storeErrors } from './stores.js';
export { areaErrors } from './areas.js';
export { initErrors } from './init.js';
export { configErrors } from './config.js';
export { productErrors } from './products.js';
export { tagErrors } from './tags.js';
export { productCustomizationErrors } from './product-customizations.js';
export { ingredientErrors } from './ingredients.js';
