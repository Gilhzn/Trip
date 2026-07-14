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
  {
    slug: 'vienna',
    name: { he: 'וינה', en: 'Vienna' },
    country: { he: 'אוסטריה', en: 'Austria' },
    countryCode: 'AT',
    lat: 48.2082,
    lon: 16.3738,
    timezone: 'Europe/Vienna',
    emoji: '🎻',
    load: () => import('./vienna').then((m) => m.vienna),
  },
  {
    slug: 'prague',
    name: { he: 'פראג', en: 'Prague' },
    country: { he: 'צ׳כיה', en: 'Czechia' },
    countryCode: 'CZ',
    lat: 50.0755,
    lon: 14.4378,
    timezone: 'Europe/Prague',
    emoji: '🌉',
    load: () => import('./prague').then((m) => m.prague),
  },
  {
    slug: 'budapest',
    name: { he: 'בודפשט', en: 'Budapest' },
    country: { he: 'הונגריה', en: 'Hungary' },
    countryCode: 'HU',
    lat: 47.4979,
    lon: 19.0402,
    timezone: 'Europe/Budapest',
    emoji: '♨️',
    load: () => import('./budapest').then((m) => m.budapest),
  },
  {
    slug: 'london',
    name: { he: 'לונדון', en: 'London' },
    country: { he: 'בריטניה', en: 'United Kingdom' },
    countryCode: 'GB',
    lat: 51.5074,
    lon: -0.1278,
    timezone: 'Europe/London',
    emoji: '🎡',
    load: () => import('./london').then((m) => m.london),
  },
  {
    slug: 'paris',
    name: { he: 'פריז', en: 'Paris' },
    country: { he: 'צרפת', en: 'France' },
    countryCode: 'FR',
    lat: 48.8566,
    lon: 2.3522,
    timezone: 'Europe/Paris',
    emoji: '🗼',
    load: () => import('./paris').then((m) => m.paris),
  },
  {
    slug: 'rome',
    name: { he: 'רומא', en: 'Rome' },
    country: { he: 'איטליה', en: 'Italy' },
    countryCode: 'IT',
    lat: 41.9028,
    lon: 12.4964,
    timezone: 'Europe/Rome',
    emoji: '🏛️',
    load: () => import('./rome').then((m) => m.rome),
  },
  {
    slug: 'amsterdam',
    name: { he: 'אמסטרדם', en: 'Amsterdam' },
    country: { he: 'הולנד', en: 'Netherlands' },
    countryCode: 'NL',
    lat: 52.3676,
    lon: 4.9041,
    timezone: 'Europe/Amsterdam',
    emoji: '🚲',
    load: () => import('./amsterdam').then((m) => m.amsterdam),
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
