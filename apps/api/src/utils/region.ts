/**
 * 行政区划特殊处理：直辖市（北京 / 上海 / 天津 / 重庆）。
 *
 * 我国直辖市在行政区划树中省级与市级同名（如「北京市 / 北京市 / 朝阳区」）。
 * 门店按业务约定直接存储省 / 市 / 区文本，为避免省列冗余且保证按区域分发
 * 时能正确匹配，直辖市的省列置空、市名列保留直辖市名、区名不变。
 */

/** 直辖市名称集合 */
export const MUNICIPALITIES = ['北京市', '上海市', '天津市', '重庆市'] as const;

export function isMunicipality(name: string): boolean {
  return (MUNICIPALITIES as readonly string[]).includes((name ?? '').trim());
}

/**
 * 门店维度归一化：直辖市的 province 列置空，市名保留在 city 列，区不变。
 * 普通省市原样返回。传入字段缺失时按空串处理。
 */
export function normalizeStoreRegion(input: {
  province?: string;
  city?: string;
  district?: string;
}): { province: string; city: string; district: string } {
  const province = (input.province ?? '').trim();
  const city = (input.city ?? '').trim();
  const district = (input.district ?? '').trim();

  if (isMunicipality(province)) {
    // 直辖市：province 置空，市名落到 city 列（若未单独填市则用原本的省名）
    return { province: '', city: city || province, district };
  }

  return { province, city, district };
}
