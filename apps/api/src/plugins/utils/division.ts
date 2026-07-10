import {
  matchDivisionByCode,
  getDivisionParent,
  matchDivisionByNames,
  isExistingCode,
  type Division,
} from '@aurouscia/china-areas/dist/index.js';

/**
 * 根据行政区划代码获取从顶级到自身的完整链路（如 110101 → [北京市, 市辖区, 东城区]）
 */
export function getDivisionPath(code: string): Division[] {
  const node = matchDivisionByCode(code, true)[0];
  if (!node) return [];

  const chain: Division[] = [node];
  let parent = getDivisionParent(code, true);
  while (parent) {
    chain.unshift(parent);
    parent = getDivisionParent(parent.code, true);
  }
  return chain;
}

/**
 * 根据行政区划代码反查省/市/区名称（缺失层级为空字符串）
 */
export function resolveDivisionNames(code: string): {
  province: string;
  city: string;
  district: string;
} {
  const path = getDivisionPath(code);
  return {
    province: path[0]?.name ?? '',
    city: path[1]?.name ?? '',
    district: path[2]?.name ?? '',
  };
}

/**
 * 将省/市/区名称解析为 regionCode 前缀，用于按代码前缀匹配门店：
 * - 仅省 → 前 2 位（全省）
 * - 省+市 → 前 4 位（全市）
 * - 省+市+区 → 完整 6 位（精确）
 * 无法解析时返回 null
 */
export function resolveAreaPrefix(province: string, city?: string, district?: string): string | null {
  let matched: Division | undefined;
  if (district) matched = matchDivisionByNames([district])[0];
  if (!matched && city) matched = matchDivisionByNames([city])[0];
  if (!matched) matched = matchDivisionByNames([province])[0];
  if (!matched) return null;

  if (district) return matched.code;
  if (city) return matched.code.slice(0, 4);
  return matched.code.slice(0, 2);
}

/** 校验是否为合法的 6 位行政区划代码 */
export function isValidRegionCode(code: string): boolean {
  return /^\d{6}$/.test(code) && isExistingCode(code);
}
