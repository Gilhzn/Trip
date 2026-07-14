import { useMemo } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import { Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import type { Poi } from '@/types/poi';
import { useI18n, useLocalized } from '@/i18n/I18nContext';
import { wazeUrl, googleMapsUrl } from '@/services/navigation';
import { categoryIcon, CATEGORY_COLORS, TILE_ATTRIBUTION, TILE_URL } from '@/lib/leaflet-setup';
import { Rating } from '@/components/ui/Rating';

interface TripMapProps {
  center: { lat: number; lon: number };
  pois: Poi[];
  /** ordered day route to draw as a polyline (poi ids) */
  routePoiIds?: string[];
}

export function TripMap({ center, pois, routePoiIds = [] }: TripMapProps) {
  const { t } = useI18n();
  const localized = useLocalized();

  const icons = useMemo(() => {
    const map = new Map<string, ReturnType<typeof categoryIcon>>();
    for (const [category, color] of Object.entries(CATEGORY_COLORS)) {
      map.set(category, categoryIcon(color));
    }
    return map;
  }, []);

  const route = routePoiIds
    .map((id) => pois.find((p) => p.id === id))
    .filter((p): p is Poi => Boolean(p))
    .map((p) => [p.lat, p.lon] as [number, number]);

  return (
    // Leaflet's controls and gestures assume LTR — isolate the map from the RTL page.
    <div dir="ltr" className="h-full w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <MapContainer center={[center.lat, center.lon]} zoom={14} scrollWheelZoom className="h-full w-full">
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        {route.length > 1 && <Polyline positions={route} pathOptions={{ color: '#0d9488', weight: 3, dashArray: '6 8' }} />}
        {pois.map((poi) => (
          <Marker key={poi.id} position={[poi.lat, poi.lon]} icon={icons.get(poi.category)}>
            <Popup>
              <div dir="auto" className="min-w-40 space-y-1.5">
                <p className="font-semibold">{localized(poi.name)}</p>
                <Rating value={poi.rating} />
                <div className="flex gap-2 pt-1">
                  <a
                    href={wazeUrl(poi.lat, poi.lon)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-semibold !text-white"
                  >
                    <Navigation className="size-3" />
                    {t('common.openInWaze')}
                  </a>
                  <a
                    href={googleMapsUrl(poi.lat, poi.lon)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-medium !text-zinc-700"
                  >
                    {t('common.openInGoogleMaps')}
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
