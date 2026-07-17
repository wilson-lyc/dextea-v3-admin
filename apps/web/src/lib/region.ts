/**
 * 行政区划特殊处理：直辖市（北京 / 上海 / 天津 / 重庆）。
 *
 * 在行政区划数据源中，直辖市为「省级 → 区级」两级结构（如 北京市 → 朝阳区），
 * 其下级直接是区，不存在同名的地级市层。省市区三级选择器（AreaSelector）对
 * 直辖市输出的是 { province: 直辖市名, city: 区名, district: "" }。
 *
 * 门店在数据库中按业务约定整体后移一位存储：省列置空、直辖市名落到 city 列、
 * 所选区落到 district 列。因此把门店存储值回显到选择器时，需做一次逆变换。
 */

/** 直辖市名称集合 */
export const MUNICIPALITIES = ["北京市", "上海市", "天津市", "重庆市"] as const

export function isMunicipality(name?: string): boolean {
  return (MUNICIPALITIES as readonly string[]).includes((name ?? "").trim())
}

/**
 * 把门店存储的省市区（数据库格式）转换为 AreaSelector 的回显值。
 * - 直辖市（province 为空且 city 为直辖市名）：还原为
 *   { province: 直辖市名, city: 区名, district: "" }。
 * - 普通省市区：原样返回。
 */
export function toAreaSelectorValue(input: {
  province?: string
  city?: string
  district?: string
}): { province: string; city: string; district: string } {
  const province = (input.province ?? "").trim()
  const city = (input.city ?? "").trim()
  const district = (input.district ?? "").trim()

  // 直辖市存储格式：province 置空、city=直辖市名、district=区名 → 前移一位回显
  if (!province && isMunicipality(city)) {
    return { province: city, city: district, district: "" }
  }

  return { province, city, district }
}
