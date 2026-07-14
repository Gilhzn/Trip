/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { TripPlan } from '@/types';
import { loadState, saveState } from './storage';

const MAX_SAVED_TRIPS = 20;

interface TripsValue {
  trips: TripPlan[];
  getTrip: (id: string) => TripPlan | undefined;
  saveTrip: (trip: TripPlan) => void;
  deleteTrip: (id: string) => void;
}

const TripContext = createContext<TripsValue | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<TripPlan[]>(() => loadState<TripPlan[]>('savedTrips', []));

  const value = useMemo<TripsValue>(
    () => ({
      trips,
      getTrip: (id) => trips.find((t) => t.id === id),
      saveTrip: (trip) => {
        setTrips((prev) => {
          const next = [trip, ...prev.filter((t) => t.id !== trip.id)].slice(0, MAX_SAVED_TRIPS);
          saveState('savedTrips', next);
          return next;
        });
      },
      deleteTrip: (id) => {
        setTrips((prev) => {
          const next = prev.filter((t) => t.id !== id);
          saveState('savedTrips', next);
          return next;
        });
      },
    }),
    [trips],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrips(): TripsValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrips must be used within TripProvider');
  return ctx;
}
