import type { Poi } from '@/types/poi';
import type { Bilingual } from '@/types/poi';
import type { WeatherDay } from '@/types/weather';
import { classifyDay } from '@/types/weather';
import type { DayPlan, ScheduledItem, ScheduleReason, TripParams } from '@/types/trip';
import { buildPartyProfile, isOpenOn, scorePoi, type PartyProfile } from './scoring';
import { centroid, haversineMeters, proximityBonus } from './clustering';
import { listDates } from '@/services/weatherService';

const MAX_DAY_VISIT_MINUTES = 480;
const LIGHT_DAY_VISIT_MINUTES = 220;
const DEFAULT_VISIT_MINUTES = 90;
const NEARBY_RADIUS_M = 1500;
const KOSHER_NEARBY_RADIUS_M = 3000;
const EMPTY_SET: ReadonlySet<string> = new Set();

interface GenerateInput {
  params: TripParams;
  pois: Poi[];
  weather: WeatherDay[];
  kosherOnly: boolean;
  /** day-trip / local tips used to enrich free days on long trips */
  localTips?: Bilingual[];
}

function weekdayOf(date: string): number {
  return new Date(date + 'T12:00:00Z').getUTCDay();
}

const SLOT_ORDER: ScheduledItem['dayPart'][] = ['morning', 'noon', 'evening', 'night'];

function pickSlot(index: number): ScheduledItem['dayPart'] {
  return SLOT_ORDER[Math.min(index, SLOT_ORDER.length - 1)];
}

function reasonFor(poi: Poi, weatherClass: ReturnType<typeof classifyDay>, isAnchor: boolean, nearAnchor: boolean): ScheduleReason {
  const kind = poi.indoorOutdoor ?? 'mixed';
  if (weatherClass === 'rainy' && kind === 'indoor') return 'weather-indoor';
  if (weatherClass === 'fair' && kind === 'outdoor') return 'weather-outdoor';
  if (isAnchor) return 'top-pick';
  if (nearAnchor) return 'nearby';
  return 'top-pick';
}

const BREAKFAST_CUISINE = /cafe|café|coffee|bakery|breakfast|brunch|patisserie|konditorei/i;

function isBreakfasty(r: Poi): boolean {
  return (r.cuisine ?? []).some((c) => BREAKFAST_CUISINE.test(c)) || (r.priceLevel ?? 4) <= 2;
}

interface MealOptions {
  breakfast?: boolean;
  /** places already chosen for this same day, never re-used within it */
  excludeToday?: ReadonlySet<string>;
}

/**
 * Pick a restaurant for a meal. Prefers unused places near the day's center;
 * once the fresh pool runs out it gracefully re-uses a great spot (never twice
 * on the same day) so every day still gets a full set of meals. Breakfast
 * favors cafés/bakeries.
 */
function pickMeal(
  restaurants: Poi[],
  used: Set<string>,
  center: { lat: number; lon: number } | null,
  kosherOnly: boolean,
  weekday: number,
  opts: MealOptions = {},
): Poi | undefined {
  const excludeToday = opts.excludeToday ?? EMPTY_SET;
  const eligible = (r: Poi) =>
    isOpenOn(r, weekday) &&
    !excludeToday.has(r.id) &&
    (!kosherOnly || r.kosher === 'yes' || r.kosher === 'only');

  let pool = restaurants.filter((r) => !used.has(r.id) && eligible(r));
  // Fresh pool exhausted → allow re-using a place from earlier in the trip.
  if (pool.length === 0) pool = restaurants.filter(eligible);
  if (pool.length === 0) return undefined;

  const radius = kosherOnly ? KOSHER_NEARBY_RADIUS_M : NEARBY_RADIUS_M;
  const scored = pool
    .map((r) => {
      let score = ((r.rating ?? 3.5) / 5) * 0.6 + ((r.popularity ?? 50) / 100) * 0.4;
      if (center) {
        const dist = haversineMeters(r.lat, r.lon, center.lat, center.lon);
        score = dist <= radius ? score + proximityBonus(dist, radius) * 0.5 : score - dist / 10000;
      }
      if (opts.breakfast && isBreakfasty(r)) score += 0.4;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score || a.r.id.localeCompare(b.r.id));
  return scored[0]?.r;
}

/**
 * Deterministic weather-adaptive trip builder: same inputs → same plan.
 * Attractions are scored per day (weather fit, popularity, kid fit, rating),
 * anchored greedily, clustered geographically, and paced by the party profile.
 */
export function generateItinerary(input: GenerateInput): DayPlan[] {
  const { params, pois, weather, kosherOnly, localTips = [] } = input;
  const dates = listDates(params.startDate, params.endDate);
  const party: PartyProfile = buildPartyProfile(
    params.travelers.length > 0 ? params.travelers.map((t) => t.age) : [30],
  );

  const attractions = pois.filter((p) => p.category === 'attraction');
  const restaurants = pois.filter((p) => p.category === 'restaurant');

  const weatherByDate = new Map(weather.map((w) => [w.date, w]));
  const usedAttractions = new Set<string>();
  const usedRestaurants = new Set<string>();
  let tipCursor = 0;

  return dates.map((date, dayIndex) => {
    const weatherDay: WeatherDay = weatherByDate.get(date) ?? {
      date,
      parts: {
        morning: { tempC: 18, precipProbability: 20, weatherCode: 2 },
        noon: { tempC: 22, precipProbability: 20, weatherCode: 2 },
        evening: { tempC: 19, precipProbability: 20, weatherCode: 2 },
        night: { tempC: 14, precipProbability: 20, weatherCode: 2 },
      },
      tMinC: 14,
      tMaxC: 22,
      precipSumMm: 0,
      source: 'climate',
    };
    const weatherClass = classifyDay(weatherDay);
    const weekday = weekdayOf(date);
    const isFirstDay = dayIndex === 0;
    const isLastDay = dayIndex === dates.length - 1;
    const lightDay = isFirstDay || isLastDay;

    const slotBudget = lightDay ? Math.min(2, party.slotBudget) : party.slotBudget;
    const minuteBudget = lightDay ? LIGHT_DAY_VISIT_MINUTES : MAX_DAY_VISIT_MINUTES;
    const fullDay = !lightDay;

    const candidates = attractions.filter((p) => !usedAttractions.has(p.id) && isOpenOn(p, weekday));

    const items: ScheduledItem[] = [];
    const chosen: Poi[] = [];
    let minutesUsed = 0;

    // Anchor: best base score for this day's weather.
    const ranked = candidates
      .map((poi) => ({ poi, score: scorePoi(poi, weatherClass, party) }))
      .sort((a, b) => b.score - a.score || a.poi.id.localeCompare(b.poi.id));

    for (const { poi } of ranked) {
      if (chosen.length >= slotBudget) break;
      const visitMin = poi.visitDurationMin ?? DEFAULT_VISIT_MINUTES;
      if (minutesUsed + visitMin > minuteBudget && chosen.length > 0) continue;

      if (chosen.length === 0) {
        chosen.push(poi);
        minutesUsed += visitMin;
        continue;
      }
      // Non-anchor slots: re-rank remaining by base score + proximity to the anchor.
      break;
    }

    if (chosen.length > 0 && chosen.length < slotBudget) {
      const anchor = chosen[0];
      const rest = ranked
        .filter(({ poi }) => poi.id !== anchor.id)
        .map(({ poi, score }) => ({
          poi,
          score: score + 0.15 * proximityBonus(haversineMeters(poi.lat, poi.lon, anchor.lat, anchor.lon), NEARBY_RADIUS_M),
        }))
        .sort((a, b) => b.score - a.score || a.poi.id.localeCompare(b.poi.id));
      for (const { poi } of rest) {
        if (chosen.length >= slotBudget) break;
        const visitMin = poi.visitDurationMin ?? DEFAULT_VISIT_MINUTES;
        if (minutesUsed + visitMin > minuteBudget) continue;
        chosen.push(poi);
        minutesUsed += visitMin;
      }
    }

    // Outdoor first on fair days (morning light + cooler); indoor first on rainy days.
    chosen.sort((a, b) => {
      const rank = (p: Poi) => {
        const kind = p.indoorOutdoor ?? 'mixed';
        if (weatherClass === 'rainy') return kind === 'indoor' ? 0 : 1;
        return kind === 'outdoor' ? 0 : kind === 'mixed' ? 1 : 2;
      };
      return rank(a) - rank(b);
    });

    chosen.forEach((poi, i) => {
      usedAttractions.add(poi.id);
      const anchor = chosen[0];
      const nearAnchor =
        i > 0 && haversineMeters(poi.lat, poi.lon, anchor.lat, anchor.lon) <= NEARBY_RADIUS_M;
      items.push({
        poiId: poi.id,
        dayPart: pickSlot(i),
        reason: reasonFor(poi, weatherClass, i === 0, nearAnchor),
      });
    });

    // Meals near the day's geographic center. Full days get breakfast too.
    const dayCenter = centroid(chosen) ?? { lat: params.lat, lon: params.lon };
    const dayUsed = new Set<string>();
    const pickDayMeal = (mealOpts: MealOptions) => {
      const meal = pickMeal(restaurants, usedRestaurants, dayCenter, kosherOnly, weekday, {
        ...mealOpts,
        excludeToday: dayUsed,
      });
      if (meal) {
        usedRestaurants.add(meal.id);
        dayUsed.add(meal.id);
      }
      return meal;
    };
    const breakfast = fullDay ? pickDayMeal({ breakfast: true }) : undefined;
    const lunch = pickDayMeal({});
    const dinner = pickDayMeal({});

    // Contextual note (priority: arrival/departure > weather > pacing).
    let noteKey: string | undefined;
    if (isFirstDay) noteKey = 'itinerary.arrivalNote';
    else if (isLastDay) noteKey = 'itinerary.departureNote';
    else if (weatherClass === 'rainy') noteKey = 'itinerary.rainyDayNote';
    else if (weatherClass === 'hot') noteKey = 'itinerary.hotDayNote';
    else if (weatherClass === 'cold') noteKey = 'itinerary.coldDayNote';
    else if (party.hasToddlers || party.hasSeniors) noteKey = 'itinerary.relaxedPaceNote';

    // Attraction pool exhausted → free day enriched with a rotating local tip.
    let tip: Bilingual | undefined;
    if (chosen.length === 0) {
      noteKey = 'itinerary.freeDayNote';
      if (localTips.length > 0) {
        tip = localTips[tipCursor % localTips.length];
        tipCursor++;
      }
    }

    return {
      date,
      weather: weatherDay,
      items,
      breakfastPoiId: breakfast?.id,
      lunchPoiId: lunch?.id,
      dinnerPoiId: dinner?.id,
      noteKey,
      tip,
    };
  });
}
