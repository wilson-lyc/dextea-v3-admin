import {
  getTopDivisions,
  getDivisionChildren,
  isExistingCode,
  type Division,
} from '@aurouscia/china-areas/dist/index.js';

/**
 * 区域码 ↔ 文本 的通用翻译工具。
 *
 * 封装 @aurouscia/china-areas，并修复其 matchDivisionByCode 的缺陷：
 * 对「市辖区」类代码（如 440200 韶关市、440300 深圳市，其下级只有
 * 县级市/县，没有以 00 结尾的市辖区代码）无法正常匹配，导致链路缺失一级。
 *
 * 本工具统一提供：
 * - codeToNames：区域码 → 省 / 市 / 区 文本
 * - namesToCode：省 / 市 / 区 文本 → 区域码（精确 / 市 / 省 三级回退）
 * - getDivisionPath：区域码 → 从顶级到自身的完整链路
 * - isValidRegionCode：区域码合法性校验
 */

/** 省 / 市 / 区 三级文本 */
export interface DivisionNames {
  province: string;
  city: string;
  district: string;
}

const EMPTY_NAMES: DivisionNames = { province: '', city: '', district: '' };

/**
 * 区域码 → 从顶级到自身的完整链路（如 440203 → [广东省, 韶关市, 武江区]）。
 *
 * 相比 @aurouscia/china-areas 的 matchDivisionByCode，本实现会正确识别
 * 「市辖区」类代码（无 00 结尾市辖区子级的地级市），并按 省 / 市 / 区 三级
 * 顺序补齐，避免链路缺失导致前端下标错位。
 *
 * 按代码层级（省 XXXX00 / 市 XXXXXX00 / 区 XXXXXX）逐级解析，可正确区分
 * 省级代码（如 440000 广东省，链路仅 [广东省]）与市级代码（如 440200 韶关市）。
 */
export function getDivisionPath(code: string): Division[] {
  const normalized = (code ?? '').trim();
  if (!/^\d{6}$/.test(normalized) || !isExistingCode(normalized)) {
    return [];
  }

  const top = getTopDivisions().find((d) => d.code === normalized.slice(0, 2) + '0000');
  if (!top) return [];

  // 省级代码（XXXX00）：链路仅省级
  if (normalized.endsWith('0000')) return [top];

  const provinceChildren = getDivisionChildren(top.code);

  // 省级直辖县级（如 东莞市 441900 无地级市层级）
  const directChild = provinceChildren.find((d) => d.code === normalized);
  if (directChild) {
    return [top, directChild];
  }

  // 地级市层级
  const city = provinceChildren.find((d) => d.code === normalized.slice(0, 4) + '00');
  if (!city) return [top];

  // 市级代码（XXXXXX00）：链路为 省 + 市
  if (normalized.endsWith('00')) return [top, city];

  const cityChildren = getDivisionChildren(city.code);
  const district = cityChildren.find((d) => d.code === normalized);
  return district ? [top, city, district] : [top, city];
}

/**
 * 区域码 → 省 / 市 / 区 文本（缺失层级为空字符串）。
 */
export function codeToNames(code: string): DivisionNames {
  const path = getDivisionPath(code);
  if (path.length === 0) return { ...EMPTY_NAMES };
  return {
    province: path[0]?.name ?? '',
    city: path[1]?.name ?? '',
    district: path[2]?.name ?? '',
  };
}

/**
 * 省 / 市 / 区 文本 → 区域码。
 *
 * 按层级逐级解析：先在省级中匹配省名，再在其下级中匹配市名，最后在市下级
 * 中匹配区名。返回最细一级匹配到的代码；无法解析时返回 null。
 *
 * 之所以逐级下钻而非全局按名匹配，是因为 @aurouscia/china-areas 的
 * matchDivisionByNames 会在全树中搜索，例如「广东省」会命中省级自身而非
 * 其下级，导致 省+市+区 只拿到省码。逐级下钻可保证拿到最细一级代码。
 */
export function namesToCode(
  province: string,
  city?: string,
  district?: string,
): string | null {
  const provinceName = (province ?? '').trim();
  const cityName = (city ?? '').trim();
  const districtName = (district ?? '').trim();
  if (!provinceName) return null;

  const provinceMatched = getTopDivisions().find((d) => d.name === provinceName);
  if (!provinceMatched) return null;
  let result: Division = provinceMatched;

  if (cityName) {
    const cityMatched = getDivisionChildren(provinceMatched.code).find(
      (d) => d.name === cityName,
    );
    if (!cityMatched) return null;
    result = cityMatched;

    if (districtName) {
      const districtMatched = getDivisionChildren(cityMatched.code).find(
        (d) => d.name === districtName,
      );
      if (!districtMatched) return null;
      result = districtMatched;
    }
  } else if (districtName) {
    // 仅有省 + 区：在省级下级中查找该区（省直辖县级场景）
    const districtMatched = getDivisionChildren(provinceMatched.code).find(
      (d) => d.name === districtName,
    );
    if (districtMatched) result = districtMatched;
  }

  return result.code;
}

/** 校验是否为合法的 6 位行政区划代码 */
export function isValidRegionCode(code: string): boolean {
  return /^\d{6}$/.test(code ?? '') && isExistingCode(code ?? '');
}

/**
 * 区域码 → 前缀匹配串，用于按地域层级做 `region_code LIKE 'prefix%'` 分发。
 *
 * 去掉末尾的 0，使省级 / 市级代码能匹配到其下所有门店：
 * - 440000 (广东省) → "44"     → 匹配 44____ 全部广东门店
 * - 440200 (韶关市) → "4402"   → 匹配 4402__ 全部韶关门店
 * - 440204 (武江区) → "440204" → 匹配 440204 精确门店
 *
 * 入参非法（如全 0）时回退为原始串，避免产生空前缀导致全表命中。
 */
export function regionCodeToPrefix(code: string): string {
  const normalized = (code ?? '').trim();
  const stripped = normalized.replace(/0+$/, '');
  return stripped.length > 0 ? stripped : normalized;
}

export { getTopDivisions, getDivisionChildren };
