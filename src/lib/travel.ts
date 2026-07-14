/**
 * Rough driving-time estimates used by the "Explore nearby" feature.
 * No routing API is required (keyless static app) — we approximate road
 * distance from the straight-line distance and a blended average speed.
 * Times are labelled as approximate in the UI.
 */
export const AVG_SPEED_KMH = 75; // blend of town + regional roads + motorway
export const ROAD_FACTOR = 1.3; // straight-line → real road distance

/** Real road km ≈ straight-line km × winding factor. */
export function roadKmFromStraight(straightKm: number): number {
  return straightKm * ROAD_FACTOR;
}

/** Estimated driving minutes for a straight-line distance. */
export function driveMinutesFromStraightKm(straightKm: number): number {
  return Math.round((roadKmFromStraight(straightKm) / AVG_SPEED_KMH) * 60);
}

/** Straight-line search radius (km) that corresponds to a max drive time. */
export function straightRadiusKmForMinutes(minutes: number): number {
  return ((minutes / 60) * AVG_SPEED_KMH) / ROAD_FACTOR;
}

/** Straight-line search radius (km) for a max road distance. */
export function straightRadiusKmForRoadKm(roadKm: number): number {
  return roadKm / ROAD_FACTOR;
}

export function formatDriveTime(minutes: number, lang: 'he' | 'en'): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (lang === 'he') {
    if (h === 0) return `${m} ד׳`;
    if (m === 0) return `${h} ש׳`;
    return `${h} ש׳ ${m} ד׳`;
  }
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatKm(km: number, lang: 'he' | 'en'): string {
  const rounded = km >= 10 ? Math.round(km) : Math.round(km * 10) / 10;
  return lang === 'he' ? `${rounded} ק״מ` : `${rounded} km`;
}
