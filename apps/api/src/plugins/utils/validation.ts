import { BizError } from '@/common/exceptions/index.js';
import { SystemErrorCodes } from '@/common/constants/error-code.constant.js';

export function parsePositiveInt(value: string, fieldName: string = 'ID'): number {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new BizError(SystemErrorCodes.INVALID_REQUEST, `无效的${fieldName}`);
  }
  return num;
}

export function validateRequired(value: unknown, fieldName: string): asserts value is NonNullable<unknown> {
  if (value === null || value === undefined) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 不能为空`);
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 不能为空`);
  }
}

export function validateEmail(email: string, fieldName: string = '邮箱'): void {
  validateRequired(email, fieldName);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 格式不正确`);
  }
}

export function validatePhone(phone: string, fieldName: string = '联系电话'): void {
  if (!phone) return;
  const phoneRegex = /^(1\d{10}|0\d{2,3}-?\d{7,8})$/;
  if (!phoneRegex.test(phone)) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 格式不正确`);
  }
}

export function validatePassword(password: string, fieldName: string = '密码'): void {
  validateRequired(password, fieldName);
  if (password.length < 6) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 长度不能少于 6 位`);
  }
}

export function validateMaxLength(value: string | undefined | null, max: number, fieldName: string): void {
  if (value === null || value === undefined) return;
  if (typeof value === 'string' && value.length > max) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 长度不能超过 ${max} 个字符`);
  }
}

export function validatePrice(price: number, fieldName: string = '价格'): void {
  if (price < 0 || price > 999999) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 必须在 0 ~ 999999 之间`);
  }
}

export function validateLongitude(lng: number, fieldName: string = '经度'): void {
  if (lng < -180 || lng > 180) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 必须在 -180 ~ 180 之间`);
  }
}

export function validateLatitude(lat: number, fieldName: string = '纬度'): void {
  if (lat < -90 || lat > 90) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 必须在 -90 ~ 90 之间`);
  }
}

export function validateSort(value: number, fieldName: string = '排序'): void {
  // 数据库列类型为 tinyint()，取值范围 0 ~ 127
  if (!Number.isInteger(value) || value < 0 || value > 127) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 必须在 0 ~ 127 之间`);
  }
}

export function validateStatus<T extends number>(
  status: number,
  validValues: readonly T[],
  fieldName: string = '状态',
): asserts status is T {
  if (!validValues.includes(status as T)) {
    throw new BizError(SystemErrorCodes.VALIDATION_ERROR, `${fieldName} 的值无效`);
  }
}
