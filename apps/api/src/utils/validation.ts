/**
 * 共享输入校验工具模块
 *
 * 统一提供给所有路由 handler 使用，遵循"快速失败"原则：
 * 校验不通过时直接 throw BizError，由全局 error handler 统一处理。
 *
 * 使用示例:
 *   const id = parsePositiveInt(request.params.id, '门店ID');
 *   validateEmail(request.body.email);
 *   validateMaxLength(request.body.name, 255, '名称');
 */

import { BizError } from '@/common/exceptions/index.js';
import { SystemErrorCodes } from '../errorcode/system.js';

// ─── 路径参数 ID 解析 ──────────────────────────────────

/**
 * 将路径参数字符串解析为正整数 ID。
 * NaN / ≤0 / 非整数 → 抛 BizError (INVALID_REQUEST)
 */
export function parsePositiveInt(value: string, fieldName: string = 'ID'): number {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new BizError(SystemErrorCodes.INVALID_REQUEST, `无效的${fieldName}`);
  }
  return num;
}

// ─── 必填字段 ──────────────────────────────────────────

/**
 * 校验必填字段不为空（null / undefined / 空字符串）。
 * 字段存在性校验应优先使用此函数，而非手动 if (!field) throw。
 */
export function validateRequired(value: unknown, fieldName: string): asserts value is NonNullable<unknown> {
  if (value === null || value === undefined) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 不能为空`);
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 不能为空`);
  }
}

// ─── 格式校验 ──────────────────────────────────────────

/**
 * 校验邮箱格式。
 * 空值会先被 validateRequired 拦截，给出友好的"不能为空"提示。
 */
export function validateEmail(email: string, fieldName: string = '邮箱'): void {
  validateRequired(email, fieldName);
  // 简单的邮箱正则：匹配大多数常见格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 格式不正确`);
  }
}

/**
 * 校验联系电话格式（手机号或座机）。
 * - 手机号：11 位数字，1 开头
 * - 座机：区号(0xx/0xxx)-号码(7-8 位)
 * phone 为空时跳过（联系电话可能是可选字段），如需必填应额外调用 validateRequired。
 */
export function validatePhone(phone: string, fieldName: string = '联系电话'): void {
  if (!phone) return; // 可选字段，空值跳过
  const phoneRegex = /^(1\d{10}|0\d{2,3}-?\d{7,8})$/;
  if (!phoneRegex.test(phone)) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 格式不正确`);
  }
}

/**
 * 校验密码强度。
 * - 密码必填
 * - 长度至少 6 位
 */
export function validatePassword(password: string, fieldName: string = '密码'): void {
  validateRequired(password, fieldName);
  if (password.length < 6) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 长度不能少于 6 位`);
  }
}

// ─── 长度校验 ──────────────────────────────────────────

/**
 * 校验字符串长度不超过最大值（对应数据库 varchar 长度约束）。
 * 空值跳过校验，如需必填应额外调用 validateRequired。
 */
export function validateMaxLength(value: string | undefined | null, max: number, fieldName: string): void {
  if (value === null || value === undefined) return;
  if (typeof value === 'string' && value.length > max) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 长度不能超过 ${max} 个字符`);
  }
}

// ─── 数值范围校验 ──────────────────────────────────────

/**
 * 校验价格范围（0 ~ 999,999）。
 */
export function validatePrice(price: number, fieldName: string = '价格'): void {
  if (price < 0 || price > 999999) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 必须在 0 ~ 999999 之间`);
  }
}

/**
 * 校验经度范围（-180 ~ 180）。
 */
export function validateLongitude(lng: number, fieldName: string = '经度'): void {
  if (lng < -180 || lng > 180) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 必须在 -180 ~ 180 之间`);
  }
}

/**
 * 校验纬度范围（-90 ~ 90）。
 */
export function validateLatitude(lat: number, fieldName: string = '纬度'): void {
  if (lat < -90 || lat > 90) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 必须在 -90 ~ 90 之间`);
  }
}

/**
 * 校验状态值是否在合法范围内。
 */
export function validateStatus<T extends number>(
  status: number,
  validValues: readonly T[],
  fieldName: string = '状态',
): asserts status is T {
  if (!validValues.includes(status as T)) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 的值无效`);
  }
}
