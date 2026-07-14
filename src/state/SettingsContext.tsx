/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { loadState, saveState } from './storage';

export type Theme = 'system' | 'light' | 'dark';
export type CurrencyCode = 'EUR' | 'ILS' | 'USD' | 'GBP' | 'CHF' | 'CZK' | 'HUF';
export type OriginCountry = 'IL' | 'US' | 'UK' | 'other';

export interface Settings {
  currency: CurrencyCode;
  theme: Theme;
  kosherOnly: boolean;
  originCountry: OriginCountry;
}

const DEFAULTS: Settings = {
  currency: 'EUR',
  theme: 'light',
  kosherOnly: false,
  originCountry: 'IL',
};

interface SettingsValue extends Settings {
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULTS,
    ...loadState<Partial<Settings>>('settings', {}),
  }));

  useEffect(() => {
    applyTheme(settings.theme);
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [settings.theme]);

  const value = useMemo<SettingsValue>(
    () => ({
      ...settings,
      update: (patch) => {
        setSettings((prev) => {
          const next = { ...prev, ...patch };
          saveState('settings', next);
          return next;
        });
      },
    }),
    [settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
