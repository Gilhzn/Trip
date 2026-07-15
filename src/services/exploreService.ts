import type { Poi, PoiCategory } from '@/types/poi';
import { runOverpassQuery, overpassElementToPoi, dedupePois } from './overpassService';
import { cached, TTL } from './cache';

export type ExploreCategory = Extract<PoiCategory, 'attraction' | 'restaurant' | 'hotel' | 'parking'>;

export const EXPLORE_CATEGORIES: ExploreCategory[] = ['attraction', 'restaurant', 'hotel', 'parking'];

/**
 * Per-category caps on the query radius (km). Attractions/sights are restricted
 * to notable (Wikidata-tagged) places, which keeps them light enough to search
 * wide; the dense categories (food/stays/parking) stay nearer so the public
 * Overpass API can answer quickly. The UI surfaces these caps to the user.
 */
export const CATEGORY_MAX_KM: Record<ExploreCategory, number> = {
  attraction: 150,
  restaurant: 25,
  hotel: 40,
  parking: 15,
};

const CATEGORY_LIMIT: Record<ExploreCategory, number> = {
  attraction: 120,
  restaurant: 60,
  hotel: 50,
  parking: 25,
};

function queryFor(category: ExploreCategory, lat: number, lon: number, radiusM: number): string {
  const around = `(around:${radiusM},${lat},${lon})`;
  const limit = CATEGORY_LIMIT[category];
  switch (category)  {
    case 'attraction':
      // Require a Wikidata tag → notable, day-trip-worthy sights, and small
      // enough a result set that the query stays fast even over ~150 km.
      return (
        `[out:json][timeout:50];(` +
        `nwr[tourism~"^(attraction|museum|gallery|viewpoint|zoo|theme_park|aquarium|artwork)$"][name][wikidata]${around};` +
        `nwr[historic~"^(castle|monument|fort|palace|ruins|archaeological_site|memorial)$"][name][wikidata]${around};` +
        `nwr[natural~"^(peak|waterfall|volcano|cave_entrance|glacier)$"][name][wikidata]${around};` +
        `nwr[leisure~"^(park|nature_reserve|water_park)$"][name][wikidata]${around};` +
        `);out center ${limit};`
      );
    case 'restaurant':
      return `[out:json][timeout:40];nwr[amenity~"^(restaurant|cafe)$"][name]${around};out center ${limit};`;
    case 'hotel':
      return `[out:json][timeout:40];nwr[tourism~"^(hotel|guest_house|apartment|hostel|chalet)$"][name]${around};out center ${limit};`;
    case 'parking':
      return `[out:json][timeout:40];nwr[amenity=parking][access!=private][name]${around};out center ${limit};`;
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
