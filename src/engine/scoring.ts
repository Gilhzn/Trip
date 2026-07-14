import type { Poi } from '@/types/poi';
import type { WeatherClass } from '@/types/weather';

export interface PartyProfile {
  hasKids: boolean;
  hasToddlers: boolean;
  hasSeniors: boolean;
  /** activity slots per day (morning/noon/evening) */
  slotBudget: 2 | 3;
}

export function buildPartyProfile(ages: number[]): PartyProfile {
  const hasKids = ages.some((a) => a < 12);
  const hasToddlers = ages.some((a) => a < 5);
  const hasSeniors = ages.some((a) => a > 70);
  return {
    hasKids,
    hasToddlers,
    hasSeniors,
    slotBudget: hasToddlers || hasSeniors ? 2 : 3,
  };
}

/** How well a POI suits the day's weather (0..1). */
export function weatherFit(poi: Poi, weatherClass: WeatherClass): number {
  const kind = poi.indoorOutdoor ?? 'mixed';
  switch (weatherClass) {
    case 'rainy':
      return kind === 'indoor' ? 1 : kind === 'mixed' ? 0.5 : 0.1;
    case 'hot':
      return kind === 'indoor' ? 0.9 : kind === 'mixed' ? 0.65 : 0.4;
    case 'cold':
      return kind === 'indoor' ? 0.95 : kind === 'mixed' ? 0.55 : 0.3;
    case 'fair':
      return kind === 'outdoor' ? 1 : kind === 'mixed' ? 0.8 : 0.6;
  }
}

/**
 * Base desirability of a POI on a given weather day for this party (0..~1).
 * Geographic proximity is added separately during day assembly.
 */
export function scorePoi(poi: Poi, weatherClass: WeatherClass, party: PartyProfile): number {
  const popularity = (poi.popularity ?? 50) / 100;
  const rating = poi.rating !== undefined ? poi.rating / 5 : 0.6;
  const kidFit = party.hasKids ? (poi.kidFriendly ?? 1) / 3 : 0.7;
  return 0.4 * weatherFit(poi, weatherClass) + 0.3 * popularity + 0.15 * kidFit + 0.15 * rating;
}

export function isOpenOn(poi: Poi, weekday: number): boolean {
  return !poi.openingDays || poi.openingDays.includes(weekday);
}
