import { fetchJson } from './http';
import { cached, TTL } from './cache';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export interface GeoResult {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  admin1?: string;
  lat: number;
  lon: number;
  timezone: string;
  population?: number;
}

interface GeocodingResponse {
  results?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    country_code?: string;
    admin1?: string;
    timezone?: string;
    population?: number;
  }[];
}

export async function searchCities(query: string, lang: 'he' | 'en'): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const key = `geo:${lang}:${q.toLowerCase()}`;
  return cached(key, TTL.geocoding, async () => {
    const url = `${GEOCODING_URL}?name=${encodeURIComponent(q)}&count=8&language=${lang}&format=json`;
    const data = await fetchJson<GeocodingResponse>(url);
    return (data.results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      country: r.country ?? '',
      countryCode: (r.country_code ?? '').toUpperCase(),
      admin1: r.admin1,
      lat: r.latitude,
      lon: r.longitude,
      timezone: r.timezone ?? 'auto',
      population: r.population,
    }));
  });
}
