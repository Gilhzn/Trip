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

export interface ReverseGeo {
  name: string;
  countryCode: string;
  timezone: string;
  lat: number;
  lon: number;
}

interface NominatimReverse {
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country_code?: string;
  };
}

/** Reverse-geocode GPS coords to a city name + country (for current-location trips). */
export async function reverseGeocode(lat: number, lon: number, lang: 'he' | 'en'): Promise<ReverseGeo> {
  const key = `revgeo:${lang}:${lat.toFixed(3)}:${lon.toFixed(3)}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto';
  return cached(key, TTL.geocoding, async () => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&accept-language=${lang}`;
    const data = await fetchJson<NominatimReverse>(url);
    const a = data.address ?? {};
    const name = a.city || a.town || a.village || a.municipality || a.county || a.state || data.name || '';
    return {
      name,
      countryCode: (a.country_code ?? '').toUpperCase(),
      timezone,
      lat,
      lon,
    };
  });
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
