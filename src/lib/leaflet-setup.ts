import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Vite bundles Leaflet's default marker PNGs to hashed URLs; without this the
// default icon 404s (classic Leaflet+bundler gotcha).
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

export const TILE_URL = 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Category-colored circle markers (SVG divIcon) so POI types are scannable. */
export function categoryIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 25 15 25s15-14 15-25C30 6.7 23.3 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -36],
  });
}

export const CATEGORY_COLORS: Record<string, string> = {
  attraction: '#0d9488',
  restaurant: '#f59e0b',
  hotel: '#8b5cf6',
  parking: '#64748b',
  rental: '#0ea5e9',
};
