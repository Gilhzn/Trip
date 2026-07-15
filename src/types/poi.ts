export type PoiCategory = 'attraction' | 'restaurant' | 'hotel' | 'parking' | 'rental';
export type PriceLevelValue = 1 | 2 | 3 | 4; // €..€€€€
export type IndoorOutdoor = 'indoor' | 'outdoor' | 'mixed';
export type KosherStatus = 'yes' | 'only' | 'no' | 'unknown';
export type DietStatus = 'yes' | 'only' | 'no' | 'unknown';

export interface Bilingual {
  he: string;
  en: string;
}

export interface Poi {
  /** pack: "salzburg:hohensalzburg"; overpass: "osm:node/123" */
  id: string;
  category: PoiCategory;
  name: Bilingual;
  description?: Bilingual;
  lat: number;
  lon: number;
  /** 0–5, curated (undefined for OSM-sourced POIs — UI hides stars) */
  rating?: number;
  /** 0–100, curated ranking weight */
  popularity?: number;
  priceLevel?: PriceLevelValue;
  /** attractions: adult entry fee in EUR; 0 = free */
  entryFeeEur?: number;
  /** hotels: indicative price per night in EUR */
  pricePerNightEur?: number;
  /** restaurants only */
  kosher?: KosherStatus;
  /** restaurants: gluten-free availability (from OSM diet:gluten_free where known) */
  glutenFree?: DietStatus;
  cuisine?: string[];
  indoorOutdoor?: IndoorOutdoor;
  /** typical visit length, minutes */
  visitDurationMin?: number;
  /** 0 unsuitable → 3 great for kids */
  kidFriendly?: 0 | 1 | 2 | 3;
  /** 0=Sun..6=Sat; undefined = open daily */
  openingDays?: number[];
  website?: string;
  /** emoji used as a visual hint on cards (no bundled photos in v1) */
  emoji?: string;
  source: 'pack' | 'overpass';
}
