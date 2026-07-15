import { useEffect, useMemo, useRef, useState } from 'react';
import type { Poi } from '@/types/poi';
import { exploreAround, type ExploreCategory } from '@/services/exploreService';
import { haversineMeters } from '@/engine/clustering';
import {
  driveMinutesFromStraightKm,
  roadKmFromStraight,
  straightRadiusKmForMinutes,
  straightRadiusKmForRoadKm,
} from '@/lib/travel';
import type { TravelInfo } from '@/components/poi/PoiCard';

export type RadiusMode = 'time' | 'km';

export interface RadiusPoi {
  poi: Poi;
  travel: TravelInfo;
  straightKm: number;
}

const DEBOUNCE_MS = 550;

function normalizeName(poi: Poi): string {
  return `${poi.category}:${poi.name.en.trim().toLowerCase()}`;
}

/**
 * Merges curated (in-area) POIs with live Overpass discovery out to a travel
 * radius, each annotated with its estimated drive time/distance from `base`.
 * Discovery is debounced and fires only once the user expands past the city
 * (`cityOnly`), so opening a tab never triggers a network call on its own.
 */
export function useRadiusPois(opts: {
  base: { lat: number; lon: number };
  categories: ExploreCategory[];
  curated: Poi[];
  mode: RadiusMode;
  value: number;
  cityOnly: boolean;
}): { items: RadiusPoi[]; loading: boolean; error: boolean; discoveredCount: number } {
  const { base, categories, curated, mode, value, cityOnly } = opts;
  const [discovered, setDiscovered] = useState<Poi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const reqId = useRef(0);

  const radiusStraightKm =
    mode === 'time' ? straightRadiusKmForMinutes(value) : straightRadiusKmForRoadKm(value);
  const catKey = categories.join(',');

  useEffect(() => {
    if (cityOnly) {
      setDiscovered([]);
      setLoading(false);
      setError(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    setError(false);
    const timer = setTimeout(async () => {
      try {
        const pois = await exploreAround(base, radiusStraightKm, categories);
        if (reqId.current === id) {
          setDiscovered(pois);
          setLoading(false);
        }
      } catch {
        if (reqId.current === id) {
          setDiscovered([]);
          setError(true);
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // radiusStraightKm changes with mode/value; base identity handled by lat/lon
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.lat, base.lon, catKey, Math.round(radiusStraightKm), cityOnly]);

  const items = useMemo(() => {
    const toRadiusPoi = (poi: Poi): RadiusPoi => {
      const straightKm = haversineMeters(base.lat, base.lon, poi.lat, poi.lon) / 1000;
      return {
        poi,
        straightKm,
        travel: { km: roadKmFromStraight(straightKm), minutes: driveMinutesFromStraightKm(straightKm) },
      };
    };
    const within = (r: RadiusPoi) => (mode === 'time' ? r.travel.minutes <= value : r.travel.km <= value);

    const curatedItems = curated.map(toRadiusPoi).filter((r) => cityOnly || within(r));
    const seen = new Set(curatedItems.map((r) => normalizeName(r.poi)));

    const discoveredItems = discovered
      .map(toRadiusPoi)
      .filter((r) => within(r) && !seen.has(normalizeName(r.poi)));

    return [...curatedItems, ...discoveredItems].sort((a, b) => a.straightKm - b.straightKm);
  }, [curated, discovered, base.lat, base.lon, mode, value, cityOnly]);

  return { items, loading, error, discoveredCount: discovered.length };
}
