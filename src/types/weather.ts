export type DayPart = 'morning' | 'noon' | 'evening' | 'night';

export const DAY_PARTS: DayPart[] = ['morning', 'noon', 'evening', 'night'];

export interface DayPartWeather {
  tempC: number;
  /** 0–100; in climate mode: share of sampled years with rain */
  precipProbability: number;
  /** WMO weather code (Open-Meteo) */
  weatherCode: number;
}

export interface WeatherDay {
  /** ISO yyyy-mm-dd */
  date: string;
  parts: Record<DayPart, DayPartWeather>;
  tMinC: number;
  tMaxC: number;
  precipSumMm: number;
  /** 'climate' = multi-year seasonal average shown when beyond forecast horizon */
  source: 'forecast' | 'climate';
}

export type WeatherClass = 'rainy' | 'hot' | 'cold' | 'fair';

export function classifyDay(day: WeatherDay): WeatherClass {
  const noonPrecip = day.parts.noon.precipProbability;
  const morningPrecip = day.parts.morning.precipProbability;
  if (noonPrecip >= 55 || morningPrecip >= 55 || day.precipSumMm >= 5) return 'rainy';
  if (day.tMaxC >= 30) return 'hot';
  if (day.tMaxC <= 5) return 'cold';
  return 'fair';
}
