/**
 * 行政区划特殊处理：直辖市（北京 / 上海 / 天津 / 重庆）。
 *
 * 在行政区划数据源中，直辖市为「省级 → 区级」两级结构（如 北京市 → 朝阳区），
 * 其下级直接是区，不存在同名的地级市层。因此省市区三级选择器对直辖市返回的是
 * { province: 直辖市名, city: 区名, district: '' }（用户实际在第二级里选的是区）。
 *
 * 门店按业务约定直接存储省 / 市 / 区文本。为避免省列语义错位、且保证按区域分发
 * 时能正确匹配，直辖市整体后移一位：省列置空、直辖市名落到 city 列、所选的区落到
 * district 列。普通省市区（三级结构）原样存储。
 */

/** 直辖市名称集合 */
export const MUNICIPALITIES = ['北京市', '上海市', '天津市', '重庆市'] as const;

export function isMunicipality(name: string): boolean {
  return (MUNICIPALITIES as readonly string[]).includes((name ?? '').trim());
}

/**
 * 门店维度归一化：把选择器输出的省市区归一为数据库存储格式。
 * - 直辖市：省列置空、直辖市名落到 city 列、所选区落到 district 列（整体后移一位）。
 * - 普通省市：原样返回。
 * 传入字段缺失时按空串处理。
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
    // 直辖市为两级结构（省=直辖市名 → 区）。选择器第二级(city)实际是区，
    // 故整体后移一位：省列置空、直辖市名落到 city 列、所选区落到 district 列。
    return { province: '', city: province, district: city || district };
  }

  return { province, city, district };
}
