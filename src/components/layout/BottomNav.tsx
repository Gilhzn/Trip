import { useState } from 'react';
import { NavLink, useMatch } from 'react-router-dom';
import {
  Bed,
  Briefcase,
  CalendarDays,
  Car,
  Compass,
  Home,
  Landmark,
  Luggage,
  Map as MapIcon,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import type { TranslationKey } from '@/i18n/he';

interface NavItem {
  to: string;
  labelKey: TranslationKey;
  icon: typeof Home;
  end?: boolean;
}

function NavButton({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const { t } = useI18n();
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors ${
          isActive ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-500 dark:text-zinc-400'
        }`
      }
    >
      <Icon className="size-5.5" />
      <span className="truncate">{t(item.labelKey)}</span>
    </NavLink>
  );
}

export function BottomNav() {
  const { t } = useI18n();
  const tripMatch = useMatch('/trip/:id/*');
  const tripIndexMatch = useMatch('/trip/:id');
  const tripId = tripMatch?.params.id ?? tripIndexMatch?.params.id;
  const [moreOpen, setMoreOpen] = useState(false);

  const globalItems: NavItem[] = [
    { to: '/', labelKey: 'nav.home', icon: Home, end: true },
    { to: '/trips', labelKey: 'nav.trips', icon: Briefcase },
    { to: '/settings', labelKey: 'nav.settings', icon: Settings },
  ];

  const tripItems: NavItem[] = tripId
    ? [
        { to: `/trip/${tripId}`, labelKey: 'nav.itinerary', icon: CalendarDays, end: true },
        { to: `/trip/${tripId}/food`, labelKey: 'nav.food', icon: UtensilsCrossed },
        { to: `/trip/${tripId}/map`, labelKey: 'nav.map', icon: MapIcon },
        { to: `/trip/${tripId}/packing`, labelKey: 'nav.packing', icon: Luggage },
      ]
    : [];

  const moreItems: NavItem[] = tripId
    ? [
        { to: `/trip/${tripId}/explore`, labelKey: 'nav.explore', icon: Compass },
        { to: `/trip/${tripId}/attractions`, labelKey: 'nav.attractions', icon: Landmark },
        { to: `/trip/${tripId}/lodging`, labelKey: 'nav.lodging', icon: Bed },
        { to: `/trip/${tripId}/safety`, labelKey: 'nav.safety', icon: ShieldCheck },
        { to: `/trip/${tripId}/driving`, labelKey: 'nav.driving', icon: Car },
        { to: '/', labelKey: 'nav.home', icon: Home, end: true },
      ]
    : [];

  return (
    <>
      {moreOpen && tripId && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40 animate-fade-in" />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+80px)] animate-slide-up dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">{t('nav.more')}</h3>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label={t('common.close')}
                className="grid size-9 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-zinc-50 py-4 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    <Icon className="size-6 text-primary-600 dark:text-primary-400" />
                    {t(item.labelKey)}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="flex items-stretch px-2 pt-1 pb-[max(env(safe-area-inset-bottom),8px)]">
          {tripId ? (
            <>
              {tripItems.map((item) => (
                <NavButton key={item.to} item={item} />
              ))}
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium ${
                  moreOpen ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <MoreHorizontal className="size-5.5" />
                <span>{t('nav.more')}</span>
              </button>
            </>
          ) : (
            globalItems.map((item) => <NavButton key={item.to} item={item} />)
          )}
        </div>
      </nav>
    </>
  );
}
