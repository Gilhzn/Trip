import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTripWeather, listDates } from './weatherService';

// localStorage stub for the cache layer (re-applied per test; unstubAllGlobals clears it)
const store = new Map<string, string>();
function stubLocalStorage() {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  });
}

function hourlyFor(dates: string[]) {
  const time: string[] = [];
  const temperature_2m: number[] = [];
  const precipitation_probability: number[] = [];
  const weather_code: number[] = [];
  for (const date of dates) {
    for (let h = 0; h < 24; h++) {
      time.push(`${date}T${String(h).padStart(2, '0')}:00`);
      temperature_2m.push(h < 7 ? 12 : h < 12 ? 18 : h < 17 ? 26 : 20);
      precipitation_probability.push(h >= 11 && h < 16 ? 70 : 10);
      weather_code.push(h >= 11 && h < 16 ? 63 : 2);
    }
  }
  return { time, temperature_2m, precipitation_probability, weather_code };
}

describe('listDates', () => {
  it('lists inclusive date range', () => {
    expect(listDates('2026-07-15', '2026-07-18')).toEqual(['2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18']);
  });
});

describe('getTripWeather', () => {
  beforeEach(() => {
    store.clear();
    stubLocalStorage();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-07-14T10:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('maps hourly forecast into 4 day-parts with worst-code severity', async () => {
    const dates = ['2026-07-15', '2026-07-16'];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        expect(url).toContain('api.open-meteo.com/v1/forecast');
        return {
          ok: true,
          json: async () => ({
            hourly: hourlyFor(dates),
            daily: {
              time: dates,
              temperature_2m_max: [26, 26],
              temperature_2m_min: [12, 12],
              precipitation_sum: [6, 6],
            },
          }),
        };
      }),
    );

    const days = await getTripWeather(47.8, 13.05, '2026-07-15', '2026-07-16', 'Europe/Vienna');
    expect(days).toHaveLength(2);
    const day = days[0];
    expect(day.source).toBe('forecast');
    // noon window (11-16) carries the rain: code 63, 70% precip
    expect(day.parts.noon.weatherCode).toBe(63);
    expect(day.parts.noon.precipProbability).toBe(70);
    // morning window (7-11) stays clear
    expect(day.parts.morning.weatherCode).toBe(2);
    expect(day.parts.morning.precipProbability).toBe(10);
    expect(day.tMaxC).toBe(26);
  });

  it('uses climate normals beyond the forecast horizon and merges sorted', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('archive-api')) {
        const start = new URL(url).searchParams.get('start_date')!;
        const end = new URL(url).searchParams.get('end_date')!;
        const time = listDates(start, end);
        return {
          ok: true,
          json: async () => ({
            daily: {
              time,
              temperature_2m_max: time.map(() => 30),
              temperature_2m_min: time.map(() => 16),
              precipitation_sum: time.map(() => 1),
              weather_code: time.map(() => 3),
            },
          }),
        };
      }
      const start = new URL(url).searchParams.get('start_date')!;
      const end = new URL(url).searchParams.get('end_date')!;
      const time = listDates(start, end);
      return {
        ok: true,
        json: async () => ({
          hourly: hourlyFor(time),
          daily: {
            time,
            temperature_2m_max: time.map(() => 26),
            temperature_2m_min: time.map(() => 12),
            precipitation_sum: time.map(() => 0),
          },
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    // Horizon = today(7-14) + 15 → 7-29. Trip runs 7-25..8-05 → mixed.
    const days = await getTripWeather(47.8, 13.05, '2026-07-25', '2026-08-05', 'Europe/Vienna');
    expect(days).toHaveLength(12);
    expect(days.map((d) => d.date)).toEqual(listDates('2026-07-25', '2026-08-05'));
    expect(days[0].source).toBe('forecast');
    const climateDays = days.filter((d) => d.source === 'climate');
    expect(climateDays.length).toBe(7); // 7-30..8-05
    // 100% of sampled years had >0.5mm precip
    expect(climateDays[0].parts.noon.precipProbability).toBe(100);
    expect(climateDays[0].tMaxC).toBe(30);
    // noon temp equals sampled tMax
    expect(climateDays[0].parts.noon.tempC).toBe(30);
  });

  it('degrades to climate when the forecast API is down, and to neutral days when all APIs are down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    const days = await getTripWeather(47.8, 13.05, '2026-07-15', '2026-07-16', 'Europe/Vienna');
    expect(days).toHaveLength(2);
    expect(days[0].source).toBe('climate');
    expect(days[0].parts.noon.tempC).toBeGreaterThan(0);
  }, 60000);
});
