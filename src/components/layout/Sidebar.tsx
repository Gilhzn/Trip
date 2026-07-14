import { NavLink, useMatch } from 'react-router-dom';
import {
  Bed,
  Briefcase,
  CalendarDays,
  Car,
  Home,
  Landmark,
  Luggage,
  Map as MapIcon,
  MapPin,
  Settings,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import type { TranslationKey } from '@/i18n/he';

interface NavItem {
  to: string;
  labelKey: TranslationKey;
  icon: typeof Home;
  end?: boolean;
}

function SideLink({ item }: { item: NavItem }) {
  const { t } = useI18n();
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
            : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
        }`
      }
    >
      <Icon className="size-5 shrink-0" />
      {t(item.labelKey)}
    </NavLink>
  );
}

export function Sidebar() {
  const { t } = useI18n();
  const tripMatch = useMatch('/trip/:id/*');
  const tripIndexMatch = useMatch('/trip/:id');
  const tripId = tripMatch?.params.id ?? tripIndexMatch?.params.id;

  const globalItems: NavItem[] = [
    { to: '/', labelKey: 'nav.home', icon: Home, end: true },
    { to: '/trips', labelKey: 'nav.trips', icon: Briefcase },
    { to: '/settings', labelKey: 'nav.settings', icon: Settings },
  ];

  const tripItems: NavItem[] = tripId
    ? [
        { to: `/trip/${tripId}`, labelKey: 'nav.itinerary', icon: CalendarDays, end: true },
        { to: `/trip/${tripId}/attractions`, labelKey: 'nav.attractions', icon: Landmark },
        { to: `/trip/${tripId}/food`, labelKey: 'nav.food', icon: UtensilsCrossed },
        { to: `/trip/${tripId}/lodging`, labelKey: 'nav.lodging', icon: Bed },
        { to: `/trip/${tripId}/map`, labelKey: 'nav.map', icon: MapIcon },
        { to: `/trip/${tripId}/packing`, labelKey: 'nav.packing', icon: Luggage },
        { to: `/trip/${tripId}/safety`, labelKey: 'nav.safety', icon: ShieldCheck },
        { to: `/trip/${tripId}/driving`, labelKey: 'nav.driving', icon: Car },
      ]
    : [];

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-zinc-200 bg-white px-3 py-5 md:flex dark:border-zinc-800 dark:bg-zinc-900">
      <NavLink to="/" className="mb-6 flex items-center gap-2.5 px-2 font-bold text-primary-700 dark:text-primary-400">
        <span className="grid size-9 place-items-center rounded-xl bg-primary-600 text-white">
          <MapPin className="size-5.5" />
        </span>
        <span className="text-xl">{t('common.appName')}</span>
      </NavLink>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {tripItems.length > 0 && (
          <>
            <div className="px-3.5 pb-1 text-xs font-semibold tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
              {t('trip.overview')}
            </div>
            {tripItems.map((item) => (
              <SideLink key={item.to} item={item} />
            ))}
            <div className="my-3 border-t border-zinc-200 dark:border-zinc-800" />
          </>
        )}
        {globalItems.map((item) => (
          <SideLink key={item.to} item={item} />
        ))}
      </nav>
    </aside>
  );
}
