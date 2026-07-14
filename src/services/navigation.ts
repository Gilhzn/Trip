/** Deep links for turn-by-turn navigation apps. */
export function wazeUrl(lat: number, lon: number): string {
  return `https://waze.com/ul?ll=${lat}%2C${lon}&navigate=yes`;
}

export function googleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat}%2C${lon}`;
}
