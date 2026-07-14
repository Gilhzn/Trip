import { useState } from 'react';
import { useTrip } from '@/pages/TripPage';
import { DayTabs } from '@/components/itinerary/DayTabs';
import { DayTimeline } from '@/components/itinerary/DayTimeline';
import { WeatherStrip } from '@/components/weather/WeatherStrip';

export function ItineraryTab() {
  const { trip, poiById } = useTrip();
  const [selected, setSelected] = useState(0);
  if (!trip) return null;
  const day = trip.days[Math.min(selected, trip.days.length - 1)];

  return (
    <div className="space-y-4 animate-fade-in">
      <DayTabs days={trip.days} selected={selected} onSelect={setSelected} />
      <WeatherStrip day={day.weather} />
      <DayTimeline day={day} poiById={poiById} />
    </div>
  );
}
