import { config } from '@/config.js';

export interface GeocodeResult {
  longitude: number;
  latitude: number;
}

/**
 * 地理编码能力（扩展点）。
 *
 * 当前实现基于高德地图（Amap）Web 服务。该能力未来可能更换厂商
 * （百度 / 腾讯 / Google 等），只需提供一个新的 Geocoder 实现，
 * 再替换下方 `geocoder` 单例即可，调用方无需改动。
 */
export interface Geocoder {
  geocode(
    province: string,
    city: string,
    district: string,
    address: string,
  ): Promise<GeocodeResult | null>;
}

interface AmapGeocodeResponse {
  status: string;
  info: string;
  geocodes?: Array<{
    location: string;
    [key: string]: unknown;
  }>;
}

/** 高德地图（Amap）地理编码实现 */
class AmapGeocoder implements Geocoder {
  async geocode(
    province: string,
    city: string,
    district: string,
    address: string,
  ): Promise<GeocodeResult | null> {
    const key = config.amap.key;
    if (!key) {
      return null;
    }

    const fullAddress = [province, city, district, address].filter(Boolean).join('');

    const url = new URL('https://restapi.amap.com/v3/geocode/geo');
    url.searchParams.set('key', key);
    url.searchParams.set('address', fullAddress);
    url.searchParams.set('city', city || '');
    url.searchParams.set('output', 'JSON');

    const response = await fetch(url.toString());
    if (!response.ok) {
      return null;
    }

    const data: AmapGeocodeResponse = await response.json();

    if (data.status !== '1' || !data.geocodes || data.geocodes.length === 0) {
      return null;
    }

    const location = data.geocodes[0].location;
    if (!location) {
      return null;
    }

    const [lng, lat] = location.split(',').map(Number);
    if (isNaN(lng) || isNaN(lat)) {
      return null;
    }

    return { longitude: lng, latitude: lat };
  }
}

/** 当前启用的地理编码实现（默认高德）。换厂商时替换此单例即可。 */
export const geocoder: Geocoder = new AmapGeocoder();

export function geocode(
  province: string,
  city: string,
  district: string,
  address: string,
): Promise<GeocodeResult | null> {
  return geocoder.geocode(province, city, district, address);
}
