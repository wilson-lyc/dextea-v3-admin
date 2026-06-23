import { config } from '../config/index.js';

interface AmapGeocodeResponse {
  status: string;
  info: string;
  geocodes?: Array<{
    location: string;
    [key: string]: unknown;
  }>;
}

export interface GeocodeResult {
  longitude: number;
  latitude: number;
}

export async function geocode(
  province: string,
  city: string,
  district: string,
  address: string,
): Promise<GeocodeResult | null> {
  const key = config.amapKey;
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
