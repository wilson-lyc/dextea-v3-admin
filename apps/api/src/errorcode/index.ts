/**
 * ErrorCode 层 — 业务错误码与消息定义
 *
 * 所有错误码统一使用 1xxx 格式：
 *   1000-1099  系统级通用错误
 *   1100-1199  认证模块
 *   1200-1299  用户管理
 *   1300-1399  门店管理
 *   1400-1499  地区服务
 *   1500-1599  系统初始化
 *   1600-1699  系统配置
 *   1700-1799  商品标签
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
