import type { DayPart, DayPartWeather, WeatherDay } from '@/types/weather';
import { fetchJson } from './http';
import { cached, TTL } from './cache';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
/** Open-Meteo serves up to 16 forecast days; keep one day of margin. */
const FORECAST_HORIZON_DAYS = 15;
const CLIMATE_SAMPLE_YEARS = 5;

interface ForecastResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: (number | null)[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

interface ArchiveResponse {
  daily: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_sum: (number | null)[];
    weather_code: (number | null)[];
  };
}

const DAY_PART_HOURS: Record<DayPart, [number, number]> = {
  morning: [7, 11],
  noon: [11, 16],
  evening: [16, 21],
  night: [21, 24],
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
}

export function listDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  for (let d = startDate; d <= endDate && dates.length < 40; d = addDays(d, 1)) {
    dates.push(d);
  }
  return dates;
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** Severity rank so a part's icon reflects its worst weather (rain trumps clouds). */
function codeSeverity(code: number): number {
  if (code >= 95) return 100; // thunderstorm
  if (code >= 85) return 80; // snow showers
  if (code >= 80) return 70; // rain showers
  if (code >= 71) return 75; // snow
  if (code >= 61) return 60; // rain
  if (code >= 51) return 40; // drizzle
  if (code >= 45) return 30; // fog
  return code; // 0–3 clear..overcast
}

function partFromHourly(hourly: ForecastResponse['hourly'], date: string, part: DayPart): DayPartWeather {
  const [from, to] = DAY_PART_HOURS[part];
  const temps: number[] = [];
  let precip = 0;
  let worstCode = 0;
  for (let i = 0; i < hourly.time.length; i++) {
    const t = hourly.time[i];
    if (!t.startsWith(date)) continue;
    const hour = Number(t.slice(11, 13));
    if (hour < from || hour >= to) continue;
    temps.push(hourly.temperature_2m[i]);
    precip = Math.max(precip, hourly.precipitation_probability[i] ?? 0);
    if (codeSeverity(hourly.weather_code[i]) > codeSeverity(worstCode)) {
      worstCode = hourly.weather_code[i];
    }
  }
  return {
    tempC: Math.round(mean(temps) * 10) / 10,
    precipProbability: Math.round(precip),
    weatherCode: worstCode,
  };
}

async function fetchForecastDays(lat: number, lon: number, startDate: string, endDate: string, timezone: string): Promise<WeatherDay[]> {
  const url =
    `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,precipitation_probability,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&timezone=${encodeURIComponent(timezone || 'auto')}&start_date=${startDate}&end_date=${endDate}`;
  const data = await fetchJson<ForecastResponse>(url);
  return data.daily.time.map((date, i) => ({
    date,
    parts: {
      morning: partFromHourly(data.hourly, date, 'morning'),
      noon: partFromHourly(data.hourly, date, 'noon'),
      evening: partFromHourly(data.hourly, date, 'evening'),
      night: partFromHourly(data.hourly, date, 'night'),
    },
    tMinC: Math.round(data.daily.temperature_2m_min[i]),
    tMaxC: Math.round(data.daily.temperature_2m_max[i]),
    precipSumMm: Math.round((data.daily.precipitation_sum[i] ?? 0) * 10) / 10,
    source: 'forecast' as const,
  }));
}

interface ClimateSample {
  tMax: number;
  tMin: number;
  precipSum: number;
  code: number;
}

/**
 * Seasonal normals for dates beyond the forecast horizon: the same calendar
 * window is sampled over the previous N years and averaged per day-of-year.
 */
async function fetchClimateDays(lat: number, lon: number, startDate: string, endDate: string, timezone: string): Promise<WeatherDay[]> {
  const wantedDates = listDates(startDate, endDate);
  const currentYear = new Date().getFullYear();
  const startYear = Number(startDate.slice(0, 4));

  const perDate = new Map<string, ClimateSample[]>(wantedDates.map((d) => [d, []]));

  const yearFetches: Promise<{ offset: number; data: ArchiveResponse } | null>[] = [];
  for (let back = 1; back <= CLIMATE_SAMPLE_YEARS; back++) {
    const sampleYear = Math.min(currentYear - back, startYear - back);
    const offset = startYear - sampleYear;
    const sampleStart = `${Number(startDate.slice(0, 4)) - offset}${startDate.slice(4)}`;
    const sampleEnd = `${Number(endDate.slice(0, 4)) - offset}${endDate.slice(4)}`;
    const url =
      `${ARCHIVE_URL}?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code` +
      `&timezone=${encodeURIComponent(timezone || 'auto')}&start_date=${sampleStart}&end_date=${sampleEnd}`;
    yearFetches.push(
      fetchJson<ArchiveResponse>(url)
        .then((data) => ({ offset, data }))
        .catch(() => null),
    );
  }

  for (const result of await Promise.all(yearFetches)) {
    if (!result) continue;
    const { offset, data } = result;
    data.daily.time.forEach((sampleDate, i) => {
      const targetDate = `${Number(sampleDate.slice(0, 4)) + offset}${sampleDate.slice(4)}`;
      const bucket = perDate.get(targetDate);
      const tMax = data.daily.temperature_2m_max[i];
      const tMin = data.daily.temperature_2m_min[i];
      if (!bucket || tMax === null || tMin === null) return;
      bucket.push({
        tMax,
        tMin,
        precipSum: data.daily.precipitation_sum[i] ?? 0,
        code: data.daily.weather_code[i] ?? 0,
      });
    });
  }

  return wantedDates.map((date) => {
    const samples = perDate.get(date) ?? [];
    if (samples.length === 0) {
      // No archive data at all — neutral mild day, still labeled climate.
      const part: DayPartWeather = { tempC: 18, precipProbability: 20, weatherCode: 2 };
      return {
        date,
        parts: { morning: part, noon: part, evening: part, night: part },
        tMinC: 12,
        tMaxC: 22,
        precipSumMm: 0,
        source: 'climate' as const,
      };
    }
    const tMax = mean(samples.map((s) => s.tMax));
    const tMin = mean(samples.map((s) => s.tMin));
    const delta = tMax - tMin;
    const rainShare = Math.round((samples.filter((s) => s.precipSum > 0.5).length / samples.length) * 100);
    // Most representative (median-severity) sampled code
    const codes = samples.map((s) => s.code).sort((a, b) => codeSeverity(a) - codeSeverity(b));
    const typicalCode = codes[Math.floor(codes.length / 2)];
    const part = (frac: number): DayPartWeather => ({
      tempC: Math.round((tMin + delta * frac) * 10) / 10,
      precipProbability: rainShare,
      weatherCode: typicalCode,
    });
    return {
      date,
      parts: { morning: part(0.45), noon: part(1), evening: part(0.6), night: part(0.15) },
      tMinC: Math.round(tMin),
      tMaxC: Math.round(tMax),
      precipSumMm: Math.round(mean(samples.map((s) => s.precipSum)) * 10) / 10,
      source: 'climate' as const,
    };
  });
}

/**
 * Weather for every trip day: real forecast where available (≤ ~16 days out),
 * multi-year seasonal averages beyond that. Sorted by date.
 */
export async function getTripWeather(lat: number, lon: number, startDate: string, endDate: string, timezone: string): Promise<WeatherDay[]> {
  const key = `weather:${lat.toFixed(2)}:${lon.toFixed(2)}:${startDate}:${endDate}`;
  return cached(key, TTL.forecast, async () => {
    const today = isoDate(new Date());
    const horizonEnd = addDays(today, FORECAST_HORIZON_DAYS);

    const forecastStart = startDate < today ? today : startDate;
    const forecastEnd = endDate > horizonEnd ? horizonEnd : endDate;

    const jobs: Promise<WeatherDay[]>[] = [];
    if (forecastStart <= forecastEnd) {
      // If the live forecast is unreachable (offline etc.), degrade to climate
      // normals for the same window rather than failing the whole trip.
      jobs.push(
        fetchForecastDays(lat, lon, forecastStart, forecastEnd, timezone).catch(() =>
          fetchClimateDays(lat, lon, forecastStart, forecastEnd, timezone),
        ),
      );
    }
    // Anything outside [today, horizonEnd] falls back to climate normals.
    if (startDate < today) {
      jobs.push(fetchClimateDays(lat, lon, startDate, addDays(today, -1) < endDate ? addDays(today, -1) : endDate, timezone));
    }
    if (endDate > horizonEnd) {
      const climateStart = addDays(horizonEnd, 1) > startDate ? addDays(horizonEnd, 1) : startDate;
      jobs.push(fetchClimateDays(lat, lon, climateStart, endDate, timezone));
    }

    const days = (await Promise.all(jobs)).flat();
    days.sort((a, b) => a.date.localeCompare(b.date));
    return days;
  });
}
