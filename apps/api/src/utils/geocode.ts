import { config } from '../config/index.js';

// 高德地图地理编码 API 响应类型
interface AmapGeocodeResponse {
  status: string;
  info: string;
  geocodes?: Array<{
    location: string;
    [key: string]: unknown;
  }>;
}

// 地理编码结果
export interface GeocodeResult {
  longitude: number;
  latitude: number;
}

/**
 * 地理编码 — 将省市区街道地址转换为经纬度坐标
 * 使用高德地图 Web API v3 实现
 * @returns 经纬度对象，地址无效或接口异常时返回 null
 */
export async function geocode(
  province: string,
  city: string,
  district: string,
  address: string,
): Promise<GeocodeResult | null> {
  const key = config.amapKey;
  if (!key) {
    return null; // 未配置高德 API Key，跳过地理编码
  }

  // 拼接完整地址，跳过空值部分
  const fullAddress = [province, city, district, address].filter(Boolean).join('');

  // 构造高德地理编码请求 URL
  const url = new URL('https://restapi.amap.com/v3/geocode/geo');
  url.searchParams.set('key', key);
  url.searchParams.set('address', fullAddress);
  url.searchParams.set('city', city || '');
  url.searchParams.set('output', 'JSON');

  const response = await fetch(url.toString());
  if (!response.ok) {
    return null; // HTTP 请求失败
  }

  const data: AmapGeocodeResponse = await response.json();

  // 校验 API 响应状态和结果
  if (data.status !== '1' || !data.geocodes || data.geocodes.length === 0) {
    return null;
  }

  const location = data.geocodes[0].location;
  if (!location) {
    return null; // 未返回坐标信息
  }

  // 高德返回格式为 "经度,纬度"
  const [lng, lat] = location.split(',').map(Number);
  if (isNaN(lng) || isNaN(lat)) {
    return null;
  }

  return { longitude: lng, latitude: lat };
}
