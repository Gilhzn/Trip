import type { Bilingual, Poi } from './poi';

export type AdvisoryOrigin = 'IL' | 'US' | 'UK' | 'generic';

export interface AdvisoryInfo {
  originCountry: AdvisoryOrigin;
  /** normalized advisory level: 1 normal precautions → 4 do not travel */
  level: 1 | 2 | 3 | 4;
  summary: Bilingual;
  /** official government source (gov.il / travel.state.gov / gov.uk) */
  officialUrl: string;
  /** when the curated summary was authored */
  updatedAt: string;
  tips: Bilingual[];
}

export interface DrivingInfo {
  rules: Bilingual[];
  vignette?: Bilingual;
  parking: Bilingual[];
  finesAvoidance: Bilingual[];
}

export interface RentalCompany {
  name: string;
  url: string;
  note?: Bilingual;
}

export interface EmergencyNumbers {
  general: string;
  police?: string;
  ambulance?: string;
}

export interface DestinationPack {
  schemaVersion: 1;
  slug: string;
  name: Bilingual;
  country: Bilingual;
  countryCode: string;
  lat: number;
  lon: number;
  /** local currency code, e.g. 'EUR' */
  currency: string;
  timezone: string;
  pois: Poi[];
  advisories: AdvisoryInfo[];
  driving: DrivingInfo;
  rentalCompanies: RentalCompany[];
  /** day-trip ideas & local know-how; also used to fill long trips */
  localTips: Bilingual[];
  emergency: EmergencyNumbers;
  /** packing rule ids to force-include (e.g. 'rain-jacket') */
  packingExtras?: string[];
}
