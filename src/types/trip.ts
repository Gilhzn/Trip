import type { Bilingual } from './poi';
import type { DayPart, WeatherDay } from './weather';
import type { OriginCountry } from '@/state/SettingsContext';

export interface Traveler {
  age: number;
}

export interface TripParams {
  /** set when a curated pack exists for the destination */
  destinationSlug?: string;
  destinationName: string;
  countryCode?: string;
  lat: number;
  lon: number;
  timezone: string;
  /** ISO yyyy-mm-dd */
  startDate: string;
  endDate: string;
  travelers: Traveler[];
  originCountry: OriginCountry;
}

export type ScheduleReason = 'weather-indoor' | 'weather-outdoor' | 'top-pick' | 'nearby' | 'meal';

export interface ScheduledItem {
  poiId: string;
  dayPart: DayPart;
  reason: ScheduleReason;
}

export interface DayPlan {
  date: string;
  weather: WeatherDay;
  items: ScheduledItem[];
  lunchPoiId?: string;
  dinnerPoiId?: string;
  /** i18n key of a contextual note (e.g. rainy-day notice) */
  noteKey?: string;
  /** extra free-day tip drawn from the destination pack */
  tip?: Bilingual;
}

export interface PackingItem {
  /** i18n-agnostic rule id; label comes from packing-rules table */
  id: string;
  label: Bilingual;
  category: 'clothing' | 'documents' | 'electronics' | 'health' | 'kids' | 'gear';
  qtyHint?: Bilingual;
}

export interface TripPlan {
  id: string;
  params: TripParams;
  days: DayPlan[];
  packingList: PackingItem[];
  generatedAt: string;
  dataMode: 'pack' | 'overpass';
}
