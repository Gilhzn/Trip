import { lazy, Suspense } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { I18nProvider } from '@/i18n/I18nContext';
import { SettingsProvider } from '@/state/SettingsContext';
import { TripProvider } from '@/state/TripContext';
import { AppShell } from '@/components/layout/AppShell';
import { HomePage } from '@/pages/HomePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SavedTripsPage } from '@/pages/SavedTripsPage';
import { TripPage } from '@/pages/TripPage';
import { ItineraryTab } from '@/pages/trip/ItineraryTab';
import { FoodTab } from '@/pages/trip/FoodTab';
import { LodgingTab } from '@/pages/trip/LodgingTab';
import { AttractionsTab } from '@/pages/trip/AttractionsTab';
import { PackingTab } from '@/pages/trip/PackingTab';
import { SafetyTab } from '@/pages/trip/SafetyTab';
import { DrivingTab } from '@/pages/trip/DrivingTab';
import { CardSkeleton } from '@/components/ui/Skeleton';

// Leaflet is heavy — load the map chunk only when the map tab opens.
const MapTab = lazy(() => import('@/pages/trip/MapTab').then((m) => ({ default: m.MapTab })));

const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/trips', element: <SavedTripsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      {
        path: '/trip/:id',
        element: <TripPage />,
        children: [
          { index: true, element: <ItineraryTab /> },
          { path: 'food', element: <FoodTab /> },
          { path: 'lodging', element: <LodgingTab /> },
          { path: 'attractions', element: <AttractionsTab /> },
          {
            path: 'map',
            element: (
              <Suspense fallback={<CardSkeleton />}>
                <MapTab />
              </Suspense>
            ),
          },
          { path: 'packing', element: <PackingTab /> },
          { path: 'safety', element: <SafetyTab /> },
          { path: 'driving', element: <DrivingTab /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <I18nProvider>
      <SettingsProvider>
        <TripProvider>
          <RouterProvider router={router} />
        </TripProvider>
      </SettingsProvider>
    </I18nProvider>
  );
}
