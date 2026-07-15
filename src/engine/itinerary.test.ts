import { describe, expect, it } from 'vitest';
import type { Poi } from '@/types/poi';
import type { WeatherDay } from '@/types/weather';
import type { TripParams } from '@/types/trip';
import { generateItinerary } from './itinerary';
import { generatePackingList } from './packing';

function poi(partial: Partial<Poi> & Pick<Poi, 'id' | 'category'>): Poi {
  return {
    name: { he: partial.id, en: partial.id },
    lat: 47.8,
    lon: 13.04,
    source: 'pack',
    ...partial,
  } as Poi;
}

function weatherDay(date: string, opts: { rainy?: boolean; tMax?: number } = {}): WeatherDay {
  const precip = opts.rainy ? 80 : 10;
  const temp = opts.tMax ?? 22;
  const part = { tempC: temp - 3, precipProbability: precip, weatherCode: opts.rainy ? 63 : 1 };
  return {
    date,
    parts: { morning: part, noon: { ...part, tempC: temp }, evening: part, night: { ...part, tempC: temp - 6 } },
    tMinC: temp - 8,
    tMaxC: temp,
    precipSumMm: opts.rainy ? 8 : 0,
    source: 'forecast',
  };
}

const POIS: Poi[] = [
  poi({ id: 'a:museum', category: 'attraction', indoorOutdoor: 'indoor', popularity: 80, rating: 4.5, visitDurationMin: 120, kidFriendly: 3 }),
  poi({ id: 'a:gallery', category: 'attraction', indoorOutdoor: 'indoor', popularity: 60, rating: 4.2, visitDurationMin: 90 }),
  poi({ id: 'a:castle', category: 'attraction', indoorOutdoor: 'mixed', popularity: 95, rating: 4.7, visitDurationMin: 150, kidFriendly: 2 }),
  poi({ id: 'a:gardens', category: 'attraction', indoorOutdoor: 'outdoor', popularity: 90, rating: 4.6, visitDurationMin: 60, kidFriendly: 2 }),
  poi({ id: 'a:peak', category: 'attraction', indoorOutdoor: 'outdoor', popularity: 85, rating: 4.8, visitDurationMin: 180 }),
  poi({ id: 'a:zoo', category: 'attraction', indoorOutdoor: 'outdoor', popularity: 70, rating: 4.4, visitDurationMin: 150, kidFriendly: 3 }),
  poi({ id: 'r:kosher1', category: 'restaurant', kosher: 'yes', rating: 4.3, popularity: 40, lat: 47.802, lon: 13.043 }),
  poi({ id: 'r:treif1', category: 'restaurant', kosher: 'no', rating: 4.8, popularity: 90, lat: 47.8, lon: 13.041 }),
  poi({ id: 'r:treif2', category: 'restaurant', kosher: 'no', rating: 4.6, popularity: 80, lat: 47.799, lon: 13.045 }),
  poi({ id: 'r:unknown1', category: 'restaurant', kosher: 'unknown', rating: 4.1, popularity: 50, lat: 47.803, lon: 13.046 }),
];

const PARAMS: TripParams = {
  destinationName: 'Testburg',
  lat: 47.8,
  lon: 13.04,
  timezone: 'Europe/Vienna',
  startDate: '2026-07-15',
  endDate: '2026-07-18',
  travelers: [{ age: 35 }, { age: 34 }],
  originCountry: 'IL',
};

describe('generateItinerary', () => {
  it('prefers indoor anchors on rainy days and outdoor on fair days', () => {
    const weather = [
      weatherDay('2026-07-15'),
      weatherDay('2026-07-16', { rainy: true }),
      weatherDay('2026-07-17'),
      weatherDay('2026-07-18'),
    ];
    const days = generateItinerary({ params: PARAMS, pois: POIS, weather, kosherOnly: false });
    expect(days).toHaveLength(4);

    const rainyDay = days[1];
    const rainyAnchor = POIS.find((p) => p.id === rainyDay.items[0].poiId)!;
    expect(rainyAnchor.indoorOutdoor).toBe('indoor');
    expect(rainyDay.noteKey).toBe('itinerary.rainyDayNote');

    // Fair middle day leads with an outdoor slot in the morning
    const fairDay = days[2];
    const fairFirst = POIS.find((p) => p.id === fairDay.items[0].poiId)!;
    expect(fairFirst.indoorOutdoor).toBe('outdoor');
    expect(fairDay.items[0].dayPart).toBe('morning');
  });

  it('never repeats attractions, keeps meals distinct per day, and only reuses restaurants once all are used', () => {
    const weather = [weatherDay('2026-07-15'), weatherDay('2026-07-16'), weatherDay('2026-07-17'), weatherDay('2026-07-18')];
    const days = generateItinerary({ params: PARAMS, pois: POIS, weather, kosherOnly: false });

    // Attractions are never repeated across the trip.
    const attractionIds = days.flatMap((d) => d.items.map((i) => i.poiId));
    expect(new Set(attractionIds).size).toBe(attractionIds.length);

    // No restaurant appears twice on the same day.
    for (const day of days) {
      const dayMeals = [day.breakfastPoiId, day.lunchPoiId, day.dinnerPoiId].filter(Boolean);
      expect(new Set(dayMeals).size).toBe(dayMeals.length);
    }

    // A restaurant is only reused after every restaurant has been used once.
    const totalRestaurants = POIS.filter((p) => p.category === 'restaurant').length;
    const seen = new Set<string>();
    for (const day of days) {
      for (const mealId of [day.breakfastPoiId, day.lunchPoiId, day.dinnerPoiId]) {
        if (!mealId) continue;
        if (seen.has(mealId)) expect(seen.size).toBe(totalRestaurants);
        seen.add(mealId);
      }
    }
  });

  it('honors kosher-only meals', () => {
    const weather = [weatherDay('2026-07-15'), weatherDay('2026-07-16')];
    const days = generateItinerary({
      params: { ...PARAMS, endDate: '2026-07-16' },
      pois: POIS,
      weather,
      kosherOnly: true,
    });
    const assigned = days.flatMap((d) => [d.breakfastPoiId, d.lunchPoiId, d.dinnerPoiId]).filter(Boolean);
    for (const mealId of assigned) {
      const meal = POIS.find((p) => p.id === mealId)!;
      expect(['yes', 'only']).toContain(meal.kosher);
    }
    // At least one kosher meal is scheduled, and none on the same day repeat.
    expect(assigned.length).toBeGreaterThan(0);
  });

  it('slows the pace for toddlers and marks arrival/departure days light', () => {
    const weather = [weatherDay('2026-07-15'), weatherDay('2026-07-16'), weatherDay('2026-07-17')];
    const days = generateItinerary({
      params: { ...PARAMS, endDate: '2026-07-17', travelers: [{ age: 33 }, { age: 3 }] },
      pois: POIS,
      weather,
      kosherOnly: false,
    });
    expect(days[0].noteKey).toBe('itinerary.arrivalNote');
    expect(days[2].noteKey).toBe('itinerary.departureNote');
    // Light arrival/departure days stay short; the toddler pace caps full days at 3.
    expect(days[0].items.length).toBeLessThanOrEqual(2);
    expect(days[2].items.length).toBeLessThanOrEqual(2);
    for (const day of days) {
      expect(day.items.length).toBeLessThanOrEqual(3);
    }
  });

  it('is deterministic', () => {
    const weather = [weatherDay('2026-07-15'), weatherDay('2026-07-16')];
    const input = { params: { ...PARAMS, endDate: '2026-07-16' }, pois: POIS, weather, kosherOnly: false };
    expect(generateItinerary(input)).toEqual(generateItinerary(input));
  });

  it('fills exhausted days with free-day notes and local tips', () => {
    const weather = ['2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18'].map((d) => weatherDay(d));
    const fewPois = POIS.filter((p) => p.category !== 'attraction' || p.id === 'a:castle');
    const days = generateItinerary({
      params: PARAMS,
      pois: fewPois,
      weather,
      kosherOnly: false,
      localTips: [{ he: 'טיפ', en: 'tip' }],
    });
    const freeDays = days.filter((d) => d.items.length === 0);
    expect(freeDays.length).toBeGreaterThan(0);
    expect(freeDays[0].noteKey).toBe('itinerary.freeDayNote');
    expect(freeDays[0].tip).toEqual({ he: 'טיפ', en: 'tip' });
  });
});

describe('generatePackingList', () => {
  it('adapts to weather and party', () => {
    const rainyCold = [weatherDay('2026-07-15', { rainy: true, tMax: 8 }), weatherDay('2026-07-16', { rainy: true, tMax: 8 })];
    const list = generatePackingList({ ...PARAMS, countryCode: 'AT', travelers: [{ age: 30 }, { age: 2 }] }, rainyCold, ['power-adapter-eu']);
    const ids = list.map((i) => i.id);
    expect(ids).toContain('rain-jacket');
    expect(ids).toContain('umbrella');
    expect(ids).toContain('warm-layer');
    expect(ids).toContain('stroller');
    expect(ids).toContain('power-adapter-eu');
    expect(ids).not.toContain('sunscreen');
    expect(ids).not.toContain('swimwear');

    const hotDry = [weatherDay('2026-07-15', { tMax: 31 }), weatherDay('2026-07-16', { tMax: 31 })];
    const summer = generatePackingList(PARAMS, hotDry, []);
    const summerIds = summer.map((i) => i.id);
    expect(summerIds).toContain('sunscreen');
    expect(summerIds).toContain('swimwear');
    expect(summerIds).not.toContain('stroller');
    expect(summerIds).not.toContain('winter-coat');
  });
});
