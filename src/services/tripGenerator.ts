import type { Poi } from '@/types/poi';
import type { TripParams, TripPlan } from '@/types/trip';
import { findDestination, matchDestination } from '@/data/destinations';
import { getTripWeather } from './weatherService';
import { fetchOverpassPois } from './overpassService';
import { generateItinerary } from '@/engine/itinerary';
import { generatePackingList } from '@/engine/packing';

export type GenerationStage = 'weather' | 'pois' | 'plan';

/**
 * Builds a complete TripPlan: resolves the destination to a curated pack (or
 * live OSM data), fetches weather for every day, and runs the itinerary and
 * packing engines.
 */
export async function generateTrip(
  params: TripParams,
  kosherOnly: boolean,
  onStage?: (stage: GenerationStage) => void,
): Promise<TripPlan> {
  const meta =
    (params.destinationSlug && findDestination(params.destinationSlug)) ||
    matchDestination(params.destinationName, params.lat, params.lon);

  onStage?.('weather');
  const weather = await getTripWeather(params.lat, params.lon, params.startDate, params.endDate, params.timezone);

  onStage?.('pois');
  let pois: Poi[];
  let dataMode: TripPlan['dataMode'];
  let localTips: { he: string; en: string }[] = [];
  let packingExtras: string[] = [];
  let countryCode = params.countryCode;

  if (meta) {
    const pack = await meta.load();
    pois = pack.pois;
    dataMode = 'pack';
    localTips = pack.localTips;
    packingExtras = pack.packingExtras ?? [];
    countryCode = pack.countryCode;
  } else {
    pois = await fetchOverpassPois(params.lat, params.lon);
    dataMode = 'overpass';
  }

  onStage?.('plan');
  const resolvedParams: TripParams = { ...params, destinationSlug: meta?.slug, countryCode };
  const days = generateItinerary({ params: resolvedParams, pois, weather, kosherOnly, localTips });
  const packingList = generatePackingList(resolvedParams, weather, packingExtras);

  return {
    id: crypto.randomUUID(),
    params: resolvedParams,
    days,
    packingList,
    generatedAt: new Date().toISOString(),
    dataMode,
    pois: dataMode === 'overpass' ? pois : undefined,
  };
}
