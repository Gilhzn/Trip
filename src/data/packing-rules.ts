import type { PackingItem } from '@/types/trip';

export interface PackingContext {
  minTemp: number;
  maxTemp: number;
  rainyDays: number;
  nights: number;
  hasKids: boolean;
  hasToddlers: boolean;
  countryCode?: string;
  /** rule ids force-included by the destination pack */
  extras: Set<string>;
}

interface PackingRule extends Omit<PackingItem, 'qtyHint'> {
  when: (ctx: PackingContext) => boolean;
  qtyHint?: (ctx: PackingContext) => { he: string; en: string } | undefined;
}

const always = () => true;

export const PACKING_RULES: PackingRule[] = [
  // Documents & money
  { id: 'passport', category: 'documents', label: { he: 'דרכונים (בתוקף 6 חודשים+)', en: 'Passports (6+ months validity)' }, when: always },
  { id: 'travel-insurance', category: 'documents', label: { he: 'ביטוח נסיעות (פוליסה מודפסת/דיגיטלית)', en: 'Travel insurance (printed/digital policy)' }, when: always },
  { id: 'credit-cards', category: 'documents', label: { he: 'כרטיסי אשראי + מעט מזומן מקומי', en: 'Credit cards + some local cash' }, when: always },
  { id: 'drivers-license', category: 'documents', label: { he: 'רישיון נהיגה (מומלץ גם בינלאומי)', en: "Driver's license (international permit recommended)" }, when: always },
  { id: 'booking-copies', category: 'documents', label: { he: 'אישורי הזמנות (לינה, רכב, אטרקציות)', en: 'Booking confirmations (lodging, car, attractions)' }, when: always },

  // Clothing
  {
    id: 'shirts', category: 'clothing', label: { he: 'חולצות', en: 'Shirts' }, when: always,
    qtyHint: (ctx) => ({ he: `${Math.min(ctx.nights + 1, 10)} יח׳`, en: `${Math.min(ctx.nights + 1, 10)} pcs` }),
  },
  {
    id: 'underwear-socks', category: 'clothing', label: { he: 'הלבשה תחתונה וגרביים', en: 'Underwear & socks' }, when: always,
    qtyHint: (ctx) => ({ he: `${Math.min(ctx.nights + 2, 12)} סטים`, en: `${Math.min(ctx.nights + 2, 12)} sets` }),
  },
  { id: 'comfortable-shoes', category: 'clothing', label: { he: 'נעלי הליכה נוחות', en: 'Comfortable walking shoes' }, when: always },
  { id: 'rain-jacket', category: 'clothing', label: { he: 'מעיל גשם / ג׳קט עמיד למים', en: 'Rain jacket / waterproof shell' }, when: (ctx) => ctx.rainyDays >= 1 || ctx.extras.has('rain-jacket') },
  { id: 'umbrella', category: 'gear', label: { he: 'מטרייה מתקפלת', en: 'Compact umbrella' }, when: (ctx) => ctx.rainyDays >= 2 },
  { id: 'warm-layer', category: 'clothing', label: { he: 'שכבה חמה (פליז/סוודר)', en: 'Warm layer (fleece/sweater)' }, when: (ctx) => ctx.minTemp <= 14 },
  { id: 'winter-coat', category: 'clothing', label: { he: 'מעיל חורף, כובע וכפפות', en: 'Winter coat, hat & gloves' }, when: (ctx) => ctx.minTemp <= 4 },
  { id: 'shorts', category: 'clothing', label: { he: 'בגדים קלים / מכנסיים קצרים', en: 'Light clothing / shorts' }, when: (ctx) => ctx.maxTemp >= 24 },
  { id: 'swimwear', category: 'clothing', label: { he: 'בגדי ים', en: 'Swimwear' }, when: (ctx) => ctx.maxTemp >= 26 },
  { id: 'evening-outfit', category: 'clothing', label: { he: 'לבוש מסודר לערב (מסעדה/קונצרט)', en: 'Smart outfit for evenings (dinner/concert)' }, when: (ctx) => ctx.nights >= 3 },

  // Health & hygiene
  { id: 'toiletries', category: 'health', label: { he: 'כלי רחצה', en: 'Toiletries' }, when: always },
  { id: 'medications', category: 'health', label: { he: 'תרופות אישיות + מרשמים', en: 'Personal medications + prescriptions' }, when: always },
  { id: 'first-aid', category: 'health', label: { he: 'ערכת עזרה ראשונה קטנה (פלסטרים, משכך כאבים)', en: 'Small first-aid kit (band-aids, painkillers)' }, when: always },
  { id: 'sunscreen', category: 'health', label: { he: 'קרם הגנה וכובע', en: 'Sunscreen & hat' }, when: (ctx) => ctx.maxTemp >= 22 },
  { id: 'hand-sanitizer', category: 'health', label: { he: 'ג׳ל אלכוהול / מגבונים', en: 'Hand sanitizer / wipes' }, when: always },

  // Electronics
  { id: 'phone-charger', category: 'electronics', label: { he: 'מטענים וכבלים', en: 'Chargers & cables' }, when: always },
  { id: 'power-adapter-eu', category: 'electronics', label: { he: 'מתאם שקע אירופאי (Type C/F)', en: 'EU power adapter (Type C/F)' }, when: (ctx) => ctx.extras.has('power-adapter-eu') || ['AT', 'DE', 'FR', 'IT', 'NL', 'CZ', 'HU', 'ES', 'CH'].includes(ctx.countryCode ?? '') },
  { id: 'power-adapter-uk', category: 'electronics', label: { he: 'מתאם שקע בריטי (Type G)', en: 'UK power adapter (Type G)' }, when: (ctx) => ctx.countryCode === 'GB' },
  { id: 'power-bank', category: 'electronics', label: { he: 'סוללת גיבוי (חשוב לימי ניווט ארוכים)', en: 'Power bank (long navigation days)' }, when: always },
  { id: 'esim', category: 'electronics', label: { he: 'eSIM / חבילת גלישה בחו״ל', en: 'eSIM / roaming data plan' }, when: always },

  // Gear
  { id: 'daypack', category: 'gear', label: { he: 'תיק יום קטן', en: 'Small daypack' }, when: always },
  { id: 'refillable-bottle', category: 'gear', label: { he: 'בקבוק מים רב־פעמי (מי ברז מצוינים באירופה)', en: 'Refillable water bottle (tap water is excellent in Europe)' }, when: (ctx) => ctx.extras.has('refillable-bottle') || ctx.maxTemp >= 20 },
  { id: 'travel-locks', category: 'gear', label: { he: 'מנעול למזוודה', en: 'Luggage lock' }, when: always },

  // Kids
  { id: 'stroller', category: 'kids', label: { he: 'עגלה / מנשא', en: 'Stroller / carrier' }, when: (ctx) => ctx.hasToddlers },
  { id: 'kids-snacks', category: 'kids', label: { he: 'חטיפים ופעילויות לדרך', en: 'Snacks & travel activities' }, when: (ctx) => ctx.hasKids },
  { id: 'kids-clothes-extra', category: 'kids', label: { he: 'בגדי החלפה נוספים לילדים', en: 'Extra changes of clothes for kids' }, when: (ctx) => ctx.hasKids },
  { id: 'baby-essentials', category: 'kids', label: { he: 'ציוד לפעוטות (חיתולים, מגבונים, בקבוקים)', en: 'Toddler essentials (diapers, wipes, bottles)' }, when: (ctx) => ctx.hasToddlers },
];
