import type { Bilingual } from '@/types/poi';
import type { DestinationPack } from '@/types/destination';

export interface DestinationMeta {
  slug: string;
  name: Bilingual;
  country: Bilingual;
  countryCode: string;
  lat: number;
  lon: number;
  timezone: string;
  emoji: string;
  load: () => Promise<DestinationPack>;
}

/** Curated destinations. Packs are lazy-loaded so they stay out of the main bundle. */
export const DESTINATIONS: DestinationMeta[] = [
  {
    slug: 'salzburg',
    name: { he: 'זלצבורג', en: 'Salzburg' },
    country: { he: 'אוסטריה', en: 'Austria' },
    countryCode: 'AT',
    lat: 47.8095,
    lon: 13.055,
    timezone: 'Europe/Vienna',
    emoji: '🏰',
    load: () => import('./salzburg').then((m) => m.salzburg),
  },
];

export function findDestination(slug: string): DestinationMeta | undefined {
  return DESTINATIONS.find((d) => d.slug === slug);
}

/** Match a geocoding result to a curated pack (by name or proximity ~15km). */
export function matchDestination(name: string, lat: number, lon: number): DestinationMeta | undefined {
  const lower = name.toLowerCase();
  return DESTINATIONS.find(
    (d) =>
      d.name.en.toLowerCase() === lower ||
      d.name.he === name ||
      (Math.abs(d.lat - lat) < 0.14 && Math.abs(d.lon - lon) < 0.2),
  );
}
