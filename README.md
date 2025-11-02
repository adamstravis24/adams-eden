# Adams Eden - Website

This is a small React site created with Vite. It includes pages for Home, About, Gallery and Contact.

Install and run (PowerShell):

```powershell
npm install
npm run dev
```

Build for production:

```powershell
npm run build
npm run preview
```

## Planting data source

The Expo app and supporting scripts consume planting schedules derived from the
[plant-calendar](https://github.com/gg314/plant-calendar) project (GPL-3.0-or-later).
Run `node scripts/extractPlantCalendar.js` to regenerate the structured JSON
assets written to `assets/data/plant-data.json` and `assets/data/zip-stations.json`.
If you redistribute these derived files, retain the GPL attribution and license.

## NOAA climate lookup

Personalized frost dates rely on NOAA climate normals. Obtain a free API token
from the [NOAA Climate Data Online](https://www.ncdc.noaa.gov/cdo-web/token) portal
and expose it to the Expo app with one of the following environment variables:

```powershell
$env:EXPO_PUBLIC_NOAA_TOKEN="your-token-here"
```

Fallback names `EXPO_PUBLIC_NOAA_API_TOKEN`, `NOAA_TOKEN`, and
`NOAA_API_TOKEN` are also checked. Without a token the app will fall back to the
default spring frost date.

## Garden context usage (Expo app)

The Expo mobile portion exposes gardening state via `GardenContext` found in `src/context/GardenContext.tsx`.

Key exports:

- `useGarden()` hook – access state & actions
- `plantDatabase` – frost-adjusted plant records for the active location
- `addedPlants` – plants user added to calendar
- `gardens` – array of garden grid layouts
- `trackedPlants` – actively tracked plants with progress
- `location` – resolved climate/location info (may be null)

Loading & error flags:

- `isLocationLoading` / `locationError` – status of ZIP/NOAA lookup
- `isGardenStateLoading` / `gardenStateError` – persistence hydration status

Common actions:

```ts
const {
	lookupLocationByZip,
	createGarden,
	placePlant,
	removePlant,
	addPlantToList,
	removePlantFromList,
	startTracking,
	removeTrackedPlant,
	calculateProgress,
} = useGarden();
```

Progress example:

```ts
const progress = calculateProgress(trackedPlant);
// progress.percentComplete, progress.nextMilestone, progress.phase
```

Types are centralized in:

- `src/types/plants.ts`
- `src/types/location.ts`

This keeps the context lean and enables reuse in screens or future services.

## Weather Integration

The mobile app fetches current conditions and a 7‑day forecast using the Open‑Meteo API (no key required).

Context additions (via `useGarden()`):

- `weather` – last fetched bundle `{ currentTempF, currentCode, hourly[], daily[], conditionText, fetchedAt }`
- `isWeatherLoading` / `weatherError`
- `refreshWeather(force?: boolean)` – manually refetch (ignores 10‑minute cache if `force` true)

Persistence & offline:

- Weather data is cached in memory for 10 minutes and also persisted to AsyncStorage (`@adams_eden_weather_v1`).
- On startup or location change, cached weather is hydrated immediately, then a fresh fetch is attempted.
- If offline (Expo Network), the cached bundle continues to display; refresh will silently skip until back online.

Screen & header:

- Drawer contains a `Weather` screen showing current temp, next 24 hours (hourly), and 7‑day forecast.
- The header shows a tappable current temperature that opens the weather screen.
- Condition codes are mapped to simple emoji icons and readable text.
 - Icons now use MaterialCommunityIcons and animate (fade + scale/slide) when the value changes.

Extending icons:

Replace emoji with MaterialCommunityIcons by changing `mapWeatherCodeToIcon` in `src/services/weatherService.ts` to return icon names and rendering with `<MaterialCommunityIcons />`.
