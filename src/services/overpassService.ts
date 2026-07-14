import type { Poi } from '@/types/poi';
import { cached, TTL } from './cache';

const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const RADIUS_M = 4000;
const MAX_PER_CATEGORY = 60;

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

export async function runOverpassQuery(query: string): Promise<OverpassElement[]> {
  let lastError: unknown;
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) {
        lastError = new Error(`Overpass ${res.status}`);
        continue;
      }
      const data = (await res.json()) as OverpassResponse;
      return data.elements ?? [];
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Overpass unavailable');
}

export function overpassElementToPoi(el: OverpassElement, category: Poi['category']): Poi | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  const name = el.tags?.name;
  if (lat === undefined || lon === undefined || !name) return null;

  const tags = el.tags ?? {};
  const kosherTag = tags['diet:kosher'];
  const kosher =
    category === 'restaurant'
      ? kosherTag === 'only'
        ? ('only' as const)
        : kosherTag === 'yes' || tags.cuisine?.includes('kosher')
          ? ('yes' as const)
          : ('unknown' as const)
      : undefined;

  const indoorOutdoor: Poi['indoorOutdoor'] =
    category === 'attraction'
      ? ['museum', 'gallery', 'aquarium'].includes(tags.tourism ?? '')
        ? 'indoor'
        : ['viewpoint', 'zoo', 'theme_park'].includes(tags.tourism ?? '') || tags.leisure === 'park'
          ? 'outdoor'
          : 'mixed'
      : undefined;

  // Crude popularity proxy: places notable enough for Wikipedia/Wikidata rank higher.
  const notable = tags.wikidata || tags.wikipedia ? 65 : 45;

  return {
    id: `osm:${el.type}/${el.id}`,
    category,
    name: { he: name, en: tags['name:en'] ?? name },
    lat,
    lon,
    popularity: notable,
    kosher,
    cuisine: category === 'restaurant' && tags.cuisine ? tags.cuisine.split(';').map((c) => c.trim()) : undefined,
    indoorOutdoor,
    visitDurationMin: category === 'attraction' ? 90 : undefined,
    website: tags.website,
    source: 'overpass',
  };
}

export function dedupePois(pois: Poi[]): Poi[] {
  const seen = new Set<string>();
  return pois.filter((p) => {
    const key = `${p.category}:${p.name.en.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Live OSM fallback for cities without a curated pack. Queries run
 * sequentially (Overpass rate limits parallel requests aggressively).
 */
export async function fetchOverpassPois(lat: number, lon: number): Promise<Poi[]> {
  const key = `overpass:${lat.toFixed(3)}:${lon.toFixed(3)}`;
  return cached(key, TTL.overpass, async () => {
    const around = `(around:${RADIUS_M},${lat},${lon})`;
    const queries: { category: Poi['category']; q: string }[] = [
      {
        category: 'attraction',
        q: `[out:json][timeout:25];(nwr[tourism~"^(attraction|museum|gallery|viewpoint|zoo|theme_park|aquarium)$"]${around};nwr[historic~"^(castle|monument|fort|palace)$"]${around};);out center ${MAX_PER_CATEGORY};`,
      },
      {
        category: 'restaurant',
        q: `[out:json][timeout:25];nwr[amenity=restaurant]${around};out center ${MAX_PER_CATEGORY};`,
      },
      {
        category: 'hotel',
        q: `[out:json][timeout:25];nwr[tourism~"^(hotel|guest_house)$"]${around};out center ${MAX_PER_CATEGORY};`,
      },
      {
        category: 'parking',
        q: `[out:json][timeout:25];nwr[amenity=parking][access!=private][parking=multi-storey]${around};out center 20;`,
      },
    ];

    const pois: Poi[] = [];
    for (const { category, q } of queries) {
      try {
        const elements = await runOverpassQuery(q);
        pois.push(...elements.map((el) => overpassElementToPoi(el, category)).filter((p): p is Poi => p !== null));
      } catch {
        // Partial data beats no data; the UI flags overpass mode as limited.
      }
    }
    return dedupePois(pois).slice(0, 150);
  });
}
