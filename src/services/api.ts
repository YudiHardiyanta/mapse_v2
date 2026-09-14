import { RegionItem, Point, GeoJsonData, SelectItem } from '../types';

const API_BASE = 'https://tools.statsbali.id/selok';
const AUTH_TOKEN = 'ipds_ganteng_sekali123!';

const defaultHeaders = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  Accept: 'application/json',
};

// In-memory cache to avoid duplicate network calls
const cache = new Map<string, any>();

async function fetchWithCache<T>(url: string): Promise<T> {
  if (cache.has(url)) {
    return cache.get(url) as T;
  }

  const response = await fetch(url, {
    headers: defaultHeaders,
  });

  if (!response.ok) {
    throw new Error(`API error (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();
  cache.set(url, data);
  return data as T;
}

export async function getKecamatan(kabupatenCode: string): Promise<SelectItem[]> {
  try {
    const raw = await fetchWithCache<RegionItem[]>(`${API_BASE}/regions/3/${kabupatenCode}`);
    return raw.map((item) => ({
      title: `${(item.level_3_fullcode || '').slice(-3)} - ${item.level_3_name}`,
      value: item.level_3_fullcode || '',
    })).filter(x => x.value && !x.title.includes(' - -'));
  } catch (err) {
    console.warn('Failed to fetch kecamatan:', err);
    throw err;
  }
}

export async function getDesa(kecamatanCode: string): Promise<SelectItem[]> {
  try {
    const raw = await fetchWithCache<RegionItem[]>(`${API_BASE}/regions/4/${kecamatanCode}`);
    return raw.map((item) => ({
      title: `${(item.level_4_fullcode || '').slice(-3)} - ${item.level_4_name}`,
      value: item.level_4_fullcode || '',
    })).filter(x => x.value);
  } catch (err) {
    console.warn('Failed to fetch desa:', err);
    throw err;
  }
}

export async function getSLS(desaCode: string): Promise<SelectItem[]> {
  try {
    const raw = await fetchWithCache<RegionItem[]>(`${API_BASE}/regions/5/${desaCode}`);
    return raw.map((item) => ({
      title: `${(item.level_5_fullcode || '').slice(-4)} - ${item.level_5_name}`,
      value: item.level_5_fullcode || '',
    })).filter(x => x.value);
  } catch (err) {
    console.warn('Failed to fetch SLS:', err);
    throw err;
  }
}

export async function getSubSLS(slsCode: string): Promise<SelectItem[]> {
  try {
    const raw = await fetchWithCache<RegionItem[]>(`${API_BASE}/regions/6/${slsCode}`);
    return raw.map((item) => ({
      title: `${(item.level_6_fullcode || '').slice(-2)} - ${item.level_6_name}`,
      value: item.level_6_fullcode || '',
    })).filter(x => x.value);
  } catch (err) {
    console.warn('Failed to fetch sub-SLS:', err);
    return [];
  }
}

export async function getBoundaryMap(code: string): Promise<GeoJsonData | null> {
  const isSubsls = code.length === 16;
  const endpoint = isSubsls
    ? `${API_BASE}/maps/subsls_2025_01/${code}`
    : `${API_BASE}/maps/sls_2025_01/${code}`;

  try {
    const geojson = await fetchWithCache<GeoJsonData>(endpoint);
    return geojson;
  } catch (err) {
    console.error(`Failed to fetch boundary map for ${code}:`, err);
    return null;
  }
}

export async function getLocations(code: string): Promise<Point[]> {
  try {
    const points = await fetchWithCache<Point[]>(`${API_BASE}/locations/${code}`);
    return Array.isArray(points) ? points : [];
  } catch (err) {
    console.error(`Failed to fetch locations for ${code}:`, err);
    return [];
  }
}
