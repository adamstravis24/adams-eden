// Weather service using Open-Meteo (no key required)
// Provides current temperature, hourly (24h) and 7-day forecast

export type HourlyPoint = {
  time: string; // ISO
  tempF: number;
  code: number;
};

export type DailyPoint = {
  date: string; // ISO date midnight
  minF: number;
  maxF: number;
  code: number;
};

export type WeatherBundle = {
  currentTempF: number;
  currentCode: number;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  fetchedAt: string;
  conditionText?: string;
  unit?: 'fahrenheit' | 'celsius';
};

const cache = new Map<string, WeatherBundle>();
const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

function buildKey(lat: number, lon: number, unit: 'fahrenheit' | 'celsius') {
  const rLat = lat.toFixed(2);
  const rLon = lon.toFixed(2);
  const u = unit === 'celsius' ? 'C' : 'F';
  return `${rLat},${rLon}:${u}`;
}

function isDailyStale(bundle?: WeatherBundle): boolean {
  try {
    if (!bundle || !Array.isArray(bundle.daily) || bundle.daily.length === 0) return true;
    const first = bundle.daily[0];
    if (!first?.date) return true;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const firstDate = new Date(first.date);
    const firstStart = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate());
    return firstStart < todayStart;
  } catch {
    return true;
  }
}

export async function fetchWeather(lat: number, lon: number, force = false, unit: 'fahrenheit' | 'celsius' = 'fahrenheit'): Promise<WeatherBundle> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('Valid latitude and longitude required');
  }
  const key = buildKey(lat, lon, unit);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && !force) {
    const age = now - new Date(cached.fetchedAt).getTime();
    const stale = isDailyStale(cached) || cached.unit !== unit;
    if (age < MAX_AGE_MS && !stale) return cached;
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', 'temperature_2m,weather_code');
  url.searchParams.set('hourly', 'temperature_2m,weather_code');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min');
  url.searchParams.set('temperature_unit', unit);
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('past_days', '0');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather fetch failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  // Basic shape assumptions from Open-Meteo
  const currentTempF: number = data?.current?.temperature_2m;
  const currentCode: number = data?.current?.weather_code ?? 0;

  const hourly: HourlyPoint[] = Array.isArray(data?.hourly?.time)
    ? data.hourly.time.slice(0, 24).map((t: string, idx: number): HourlyPoint => ({
        time: t,
        tempF: data.hourly.temperature_2m?.[idx],
        code: data.hourly.weather_code?.[idx] ?? currentCode,
      })).filter((p: HourlyPoint) => typeof p.tempF === 'number')
    : [];

  const daily: DailyPoint[] = Array.isArray(data?.daily?.time)
    ? data.daily.time.map((d: string, idx: number): DailyPoint => ({
        date: d,
        minF: data.daily.temperature_2m_min?.[idx],
        maxF: data.daily.temperature_2m_max?.[idx],
        code: data.daily.weather_code?.[idx] ?? currentCode,
      }))
        .filter((p: DailyPoint) => typeof p.minF === 'number' && typeof p.maxF === 'number')
        .filter((p: DailyPoint) => {
          // Exclude any days before today (safety in case API returns a trailing past day)
          try {
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const d = new Date(p.date);
            const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            return dStart >= todayStart;
          } catch {
            return true;
          }
        })
    : [];

  const bundle: WeatherBundle = {
    currentTempF: typeof currentTempF === 'number' ? currentTempF : NaN,
    currentCode,
    hourly,
    daily,
    fetchedAt: new Date().toISOString(),
    unit,
  };
  cache.set(key, bundle);
  return bundle;
}

export function mapWeatherCodeToIcon(code: number): string {
  // MaterialCommunityIcons names
  if (code === 0) return 'weather-sunny';
  if ([1,2,3].includes(code)) return 'weather-partly-cloudy';
  if ([45,48].includes(code)) return 'weather-fog';
  if ([51,53,55,56,57].includes(code)) return 'weather-partly-rainy';
  if ([61,63,65,66,67].includes(code)) return 'weather-rainy';
  if ([71,73,75,77].includes(code)) return 'weather-snowy';
  if ([80,81,82].includes(code)) return 'weather-rainy';
  if ([85,86].includes(code)) return 'weather-snowy-heavy';
  if ([95,96,97].includes(code)) return 'weather-lightning-rainy';
  return 'thermometer';
}

export function mapWeatherCodeToText(code: number): string {
  if (code === 0) return 'Clear';
  if ([1,2,3].includes(code)) return 'Partly Cloudy';
  if ([45,48].includes(code)) return 'Fog';
  if ([51,53,55,56,57].includes(code)) return 'Drizzle';
  if ([61,63,65,66,67].includes(code)) return 'Rain';
  if ([71,73,75,77].includes(code)) return 'Snow';
  if ([80,81,82].includes(code)) return 'Showers';
  if ([85,86].includes(code)) return 'Snow Showers';
  if ([95,96,97].includes(code)) return 'Thunderstorm';
  return 'Conditions';
}
