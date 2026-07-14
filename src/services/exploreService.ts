import type { Poi, PoiCategory } from '@/types/poi';
import { runOverpassQuery, overpassElementToPoi, dedupePois } from './overpassService';
import { cached, TTL } from './cache';

export type ExploreCategory = Extract<PoiCategory, 'attraction' | 'restaurant' | 'hotel' | 'parking'>;

export const EXPLORE_CATEGORIES: ExploreCategory[] = ['attraction', 'restaurant', 'hotel', 'parking'];

/**
 * Per-category caps on the query radius (km). Attractions/sites are sparse, so
 * we search wide; restaurants/hotels are dense, so we keep them nearer to stay
 * within Overpass's limits. The UI surfaces these caps to the user.
 */
export const CATEGORY_MAX_KM: Record<ExploreCategory, number> = {
  attraction: 160,
  restaurant: 60,
  hotel: 70,
  parking: 30,
};

const CATEGORY_LIMIT: Record<ExploreCategory, number> = {
  attraction: 90,
  restaurant: 70,
  hotel: 50,
  parking: 25,
};

function queryFor(category: ExploreCategory, lat: number, lon: number, radiusM: number): string {
  const around = `(around:${radiusM},${lat},${lon})`;
  const limit = CATEGORY_LIMIT[category];
  switch (category) {
    case 'attraction':
      return (
        `[out:json][timeout:90];(` +
        `nwr[tourism~"^(attraction|museum|gallery|viewpoint|zoo|theme_park|aquarium|artwork)$"][name]${around};` +
        `nwr[historic~"^(castle|monument|fort|palace|ruins|archaeological_site)$"][name]${around};` +
        `nwr[natural~"^(peak|waterfall|beach|cave_entrance|hot_spring)$"][name]${around};` +
        `nwr[leisure~"^(park|nature_reserve|water_park)$"][name][wikidata]${around};` +
        `);out center ${limit};`
      );
    case 'restaurant':
      return `[out:json][timeout:60];nwr[amenity~"^(restaurant|cafe)$"][name]${around};out center ${limit};`;
    case 'hotel':
      return `[out:json][timeout:60];nwr[tourism~"^(hotel|guest_house|apartment|hostel|chalet)$"][name]${around};out center ${limit};`;
    case 'parking':
      return `[out:json][timeout:60];nwr[amenity=parking][access!=private][name]${around};out center ${limit};`;
  }
}

/**
 * Discover POIs of the given categories around a center point, out to a
 * straight-line radius (km). Each category is capped and queried sequentially
 * (Overpass throttles parallel requests). Distances/times are computed by the
 * caller relative to whichever center it chose.
 */
export async function exploreAround(
  center: { lat: number; lon: number },
  radiusStraightKm: number,
  categories: ExploreCategory[],
): Promise<Poi[]> {
  const { lat, lon } = center;
  const all: Poi[] = [];
  let failures = 0;

  for (const category of categories) {
    const effKm = Math.min(radiusStraightKm, CATEGORY_MAX_KM[category]);
    const radiusM = Math.round(effKm * 1000);
    const key = `explore:${category}:${lat.toFixed(2)}:${lon.toFixed(2)}:${Math.round(effKm)}`;
    try {
      const pois = await cached<Poi[]>(key, TTL.overpass, async () => {
        const elements = await runOverpassQuery(queryFor(category, lat, lon, radiusM));
        return elements
          .map((el) => overpassElementToPoi(el, category))
          .filter((p): p is Poi => p !== null);
      });
      all.push(...pois);
    } catch {
      // One category failing shouldn't sink the rest.
      failures++;
    }
  }

  // Every query failed → this is a service/network problem, not an empty area.
  if (failures === categories.length) {
    throw new Error('Overpass unavailable for all categories');
  }

  return dedupePois(all);
}
