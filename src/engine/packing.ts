import type { PackingItem, TripParams } from '@/types/trip';
import type { WeatherDay } from '@/types/weather';
import { PACKING_RULES, type PackingContext } from '@/data/packing-rules';
import { buildPartyProfile } from './scoring';
import { listDates } from '@/services/weatherService';

export function generatePackingList(params: TripParams, weather: WeatherDay[], packingExtras: string[] = []): PackingItem[] {
  const ages = params.travelers.length > 0 ? params.travelers.map((t) => t.age) : [30];
  const party = buildPartyProfile(ages);
  const nights = Math.max(listDates(params.startDate, params.endDate).length - 1, 1);

  const ctx: PackingContext = {
    minTemp: weather.length ? Math.min(...weather.map((w) => w.tMinC)) : 10,
    maxTemp: weather.length ? Math.max(...weather.map((w) => w.tMaxC)) : 25,
    rainyDays: weather.filter((w) => w.precipSumMm >= 2 || w.parts.noon.precipProbability >= 50).length,
    nights,
    hasKids: party.hasKids,
    hasToddlers: party.hasToddlers,
    countryCode: params.countryCode,
    extras: new Set(packingExtras),
  };

  return PACKING_RULES.filter((rule) => rule.when(ctx)).map((rule) => ({
    id: rule.id,
    label: rule.label,
    category: rule.category,
    qtyHint: rule.qtyHint?.(ctx),
  }));
}
