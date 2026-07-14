import { useEffect, useMemo, useState } from 'react';
import type { DestinationPack } from '@/types/destination';
import type { Poi } from '@/types/poi';
import type { TripPlan } from '@/types/trip';
import { findDestination } from '@/data/destinations';
import { useTrips } from '@/state/TripContext';

export interface TripData {
  trip: TripPlan | undefined;
  /** undefined while the pack is still loading */
  pois: Poi[] | undefined;
  poiById: Map<string, Poi>;
  /** curated pack extras (advisories, driving, rentals) — undefined in overpass mode */
  pack: DestinationPack | undefined;
  loading: boolean;
}

export function useTripData(tripId: string | undefined): TripData {
  const { getTrip } = useTrips();
  const trip = tripId ? getTrip(tripId) : undefined;
  const [pack, setPack] = useState<DestinationPack | undefined>(undefined);
  const [packLoading, setPackLoading] = useState(false);

  const slug = trip?.dataMode === 'pack' ? trip.params.destinationSlug : undefined;

  useEffect(() => {
    setPack(undefined);
    if (!slug) return;
    const meta = findDestination(slug);
    if (!meta) return;
    let cancelled = false;
    setPackLoading(true);
    meta
      .load()
      .then((loaded) => {
        if (!cancelled) setPack(loaded);
      })
      .finally(() => {
        if (!cancelled) setPackLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const pois = trip?.dataMode === 'overpass' ? trip.pois ?? [] : pack?.pois;

  const poiById = useMemo(() => new Map((pois ?? []).map((p) => [p.id, p])), [pois]);

  return { trip, pois, poiById, pack, loading: packLoading };
}
