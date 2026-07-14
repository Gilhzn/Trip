/** Great-circle distance in meters. */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function centroid(points: { lat: number; lon: number }[]): { lat: number; lon: number } | null {
  if (points.length === 0) return null;
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lon: points.reduce((s, p) => s + p.lon, 0) / points.length,
  };
}

/** 0..1 bonus for being within `radius` meters of an anchor (linear falloff). */
export function proximityBonus(distMeters: number, radius = 1500): number {
  if (distMeters >= radius) return 0;
  return 1 - distMeters / radius;
}
