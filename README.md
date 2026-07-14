# Trip — תכנון טיולים חכם ✈️

**Live app: <https://gilhzn.github.io/Trip/>** (auto-deployed from this repo via GitHub Actions on every push)

A weather-adaptive travel-planning web app. Hebrew-first (full RTL) with an English toggle. Pick a destination, dates, who's traveling and where you're from — and get a complete day-by-day plan.

## Features

- **Weather-adaptive daily itinerary** — indoor activities on rainy days, outdoor when it's fair; morning/noon/evening/night forecast per day (Open-Meteo). Dates beyond the 16-day forecast horizon show multi-year **seasonal averages**, clearly badged.
- **Food** — curated restaurants with a **kosher / non-kosher filter**, sorted by rating, popularity or price.
- **Lodging & attractions** — hand-curated recommendations with ratings, entry fees and indicative prices.
- **Prices in any currency** — EUR by default, switchable to ILS/USD/GBP/CHF/CZK/HUF with live ECB rates.
- **Interactive map** — category-colored markers, day-route overlay, one-tap **Waze** / Google Maps navigation.
- **Safety** — official government travel advisories by your home country (gov.il / travel.state.gov / gov.uk) with personal-safety tips and emergency numbers.
- **Driving & parking** — local rules, vignette requirements, parking zones and how to avoid fines and towing; car-rental recommendations.
- **Packing list** — auto-generated from the weather, season, trip length and party (kids/toddlers), with progress tracking.
- **Family-aware pacing** — the itinerary slows down for toddlers and seniors and favors kid-friendly attractions.

## Destinations

Curated content packs: Salzburg, Vienna, Prague, Budapest, London, Paris, Rome, Amsterdam. Any other city falls back to live OpenStreetMap (Overpass) data with reduced richness.

## Stack

React 19 + TypeScript + Vite, Tailwind CSS v4, react-leaflet, custom lightweight i18n (he/en with RTL). Fully static SPA — no backend, no API keys; deploy `dist/` to any static host.

## Develop

```bash
npm install
npm run dev        # dev server
npm test           # unit tests (vitest)
npm run build      # type-check + production build
npx playwright test  # e2e smoke (mobile + desktop viewports)
```

## Data sources

[Open-Meteo](https://open-meteo.com) (forecast, climate archive, geocoding) · [OpenStreetMap / Overpass](https://overpass-api.de) · [CARTO basemaps](https://carto.com) · [open.er-api.com](https://www.exchangerate-api.com) / [frankfurter.dev](https://frankfurter.dev) (ECB rates)

Advisory summaries are curated snapshots — always check the linked official source before traveling.
