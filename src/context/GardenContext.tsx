import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import rawPlantDataset from '../../assets/data/plant-data.json';
import comprehensivePlantDatabase from '../../assets/data/comprehensive-plant-database.json';
import { lookupZip, ZipStationRecord } from '../services/zipStationLookup';
import { getNoaaNormalsForZip } from '../services/noaaClimateService';
import { Plant, PlantPeriod, PlantScheduleWindow, TrackedPlant, Garden, RawPlantDataset, RawPlant, RawScheduleWindow, PlantMetadata, PlantTimelineEntry, CustomWateringEntry } from '../types/plants';
import { LocationInfo } from '../types/location';
import { fetchWeather, WeatherBundle, mapWeatherCodeToText } from '../services/weatherService';
import { db } from '../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, arrayUnion } from 'firebase/firestore';
import { rescheduleWateringReminderIfChanged, cancelWateringReminder, onPlantWatered, checkOverdueWateringReminders, scheduleWateringReminder } from '../services/notifications';
import { useAuth } from './AuthContext';

const plantDataset = rawPlantDataset as RawPlantDataset;

// Types moved to src/types

// Build emoji map from comprehensive plant database
const CATEGORY_EMOJI: Record<string, string> = {};
comprehensivePlantDatabase.plants.forEach((plant: any) => {
  if (plant.emoji) {
    CATEGORY_EMOJI[plant.commonName] = plant.emoji;
    // Add plural variations
    CATEGORY_EMOJI[plant.commonName + 's'] = plant.emoji;
    // Add common variations
    if (plant.commonName === 'Bell Pepper') {
      CATEGORY_EMOJI['Bell Peppers'] = plant.emoji;
    }
    if (plant.commonName === 'Green Beans') {
      CATEGORY_EMOJI['Green Bean'] = plant.emoji;
    }
    if (plant.commonName === 'Black-eyed Susan') {
      CATEGORY_EMOJI['Black-Eyed Susan'] = plant.emoji;
    }
  }
});

// Legacy emoji mappings (fallback for old data)
const LEGACY_EMOJI: Record<string, string> = {
  'Brussels Sprouts': '🥬',
  Cabbage: '🥬',
  Cantaloupes: '🍈',
  Celery: '🥬',
  Chard: '🥬',
  Collards: '🥬',
  Kohlrabi: '🥬',
  Leeks: '🧅',
  Okra: '🌾',
  Pumpkins: '🎃',
  Squash: '🎃',
  Strawberries: '🍓',
  Watermelon: '🍉',
  Tulip: '🌷',
  Daffodil: '🌼',
  Hydrangea: '🌸',
  Flowers: '💐',
};

// Merge legacy emojis with new ones (comprehensive DB takes precedence)
Object.entries(LEGACY_EMOJI).forEach(([name, emoji]) => {
  if (!CATEGORY_EMOJI[name]) {
    CATEGORY_EMOJI[name] = emoji;
  }
});

const FALLBACK_EMOJI = '🌱';
const CUSTOM_WATERING_STORAGE_KEY = '@adams_eden_custom_watering_v1';
const CUSTOM_WATERING_NOTIFICATION_PREFIX = 'custom-watering-';

const HARVEST_ESTIMATE_BY_CATEGORY: Record<string, number> = {
  Vegetables: 75,
  Fruits: 90,
  Herbs: 50,
  Flowers: 65,
};

const DEFAULT_SPRING_FROST_DAY = 120;
const DEFAULT_HARDINESS_ZONE = '6b';

const BASE_YEAR = 2025;

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeWindow(window: RawScheduleWindow | null | undefined): PlantScheduleWindow | undefined {
  if (!window) return undefined;
  return { ...window, startDayLocalized: window.startDayDefault };
}

function normalizePeriods(periods: RawPlant['defaultPeriods']): PlantPeriod[] {
  return periods.map(period => ({
    indoor: normalizeWindow(period.indoor),
    transplant: normalizeWindow(period.transplant),
    outdoor: normalizeWindow(period.outdoor),
  }));
}

function dayOfYearToDate(day: number) {
  const date = new Date(Date.UTC(BASE_YEAR, 0, 1));
  date.setUTCDate(day);
  return date;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatWindow(window?: PlantScheduleWindow) {
  if (!window) return 'Not applicable';
  const startDay = getWindowStartDay(window) ?? window.startDayDefault;
  const start = dayOfYearToDate(startDay);
  const end = dayOfYearToDate(startDay + Math.max(window.duration - 1, 0));
  if (window.duration <= 1) {
    return formatDate(start);
  }
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function summarizePlantingMode(periods: PlantPeriod[]) {
  const hasIndoor = periods.some(p => p.indoor);
  const hasOutdoor = periods.some(p => p.outdoor);
  const hasTransplant = periods.some(p => p.transplant);

  if (hasIndoor && hasTransplant && hasOutdoor) return 'Indoor seed → outdoor transplant';
  if (hasIndoor && hasTransplant) return 'Start indoors & transplant';
  if (hasIndoor && !hasTransplant) return 'Start indoors';
  if (!hasIndoor && hasOutdoor) return 'Direct sow outdoors';
  if (hasTransplant) return 'Transplant outdoors';
  return 'Refer to schedule';
}

function firstWindow(periods: PlantPeriod[], key: 'indoor' | 'transplant' | 'outdoor'): PlantScheduleWindow | undefined {
  for (const period of periods) {
    const window = period[key];
    if (window && window.duration > 0) return window;
  }
  return undefined;
}

function estimateHarvestDays(category: string) {
  return HARVEST_ESTIMATE_BY_CATEGORY[category] ?? 75;
}

function formatHarvestDate(startDay: number, daysToHarvest: number) {
  const harvestDay = startDay + daysToHarvest;
  const date = dayOfYearToDate(harvestDay);
  return `${formatDate(date)} (est.)`;
}

function pickEmoji(name: string, category: string) {
  if (CATEGORY_EMOJI[name]) return CATEGORY_EMOJI[name];
  if (CATEGORY_EMOJI[`${name}s`]) return CATEGORY_EMOJI[`${name}s`];
  if (CATEGORY_EMOJI[category]) return CATEGORY_EMOJI[category];
  return FALLBACK_EMOJI;
}

function computeNextWateringISO(lastWateredISO: string | undefined, frequencyDays: number, hour = 9) {
  const base = lastWateredISO ? new Date(lastWateredISO) : new Date();
  const next = new Date(base);
  next.setDate(next.getDate() + Math.max(1, frequencyDays));
  next.setHours(hour, 0, 0, 0);
  return next.toISOString();
}

async function syncCustomEntryReminder(entry: CustomWateringEntry): Promise<CustomWateringEntry> {
  const trackingId = `${CUSTOM_WATERING_NOTIFICATION_PREFIX}${entry.id}`;
  if (!entry.reminderEnabled) {
    await cancelWateringReminder(trackingId);
    return { ...entry, nextWateringAt: undefined };
  }
  const nextISO = computeNextWateringISO(entry.lastWateredAt, entry.schedule.frequencyDays, entry.schedule.remindAtHour ?? 9);
  await scheduleWateringReminder(trackingId, entry.lastWateredAt, entry.schedule.frequencyDays);
  return { ...entry, nextWateringAt: nextISO };
}

type BasePlantDefinition = {
  id: string;
  slug: string;
  name: string;
  category: string;
  image: string;
  minZone: number;
  maxZone: number;
  defaultPeriods: PlantPeriod[];
  plantType?: 'vegetable' | 'flower' | 'herb' | 'ornamental';
  bloomSeason?: string;
  description?: string;
};

// LocationInfo moved to src/types/location

const BASE_PLANTS: BasePlantDefinition[] = plantDataset.plants.map((plant: any, index) => ({
  id: `${index + 1}`,
  slug: slugify(plant.name),
  name: plant.name,
  category: plant.category,
  image: pickEmoji(plant.name, plant.category),
  minZone: plant.minZone,
  maxZone: plant.maxZone,
  defaultPeriods: plant.defaultPeriods ? normalizePeriods(plant.defaultPeriods) : [],
  plantType: plant.plantType || 'vegetable', // Default to vegetable if not specified
  bloomSeason: plant.bloomSeason,
  description: plant.description,
}));

function normalizeLocation(candidate: any): LocationInfo | null {
  if (!candidate || typeof candidate !== 'object') return null;

  const zip = typeof candidate.zip === 'string' && candidate.zip.trim().length > 0
    ? candidate.zip.trim()
    : '';
  const locationName = typeof candidate.locationName === 'string'
    ? candidate.locationName.trim()
    : '';
  const stationId = typeof candidate.stationId === 'string'
    ? candidate.stationId.trim()
    : '';
  const stationName = typeof candidate.stationName === 'string'
    ? candidate.stationName.trim()
    : '';
  const alternateStationIds = Array.isArray(candidate.alternateStationIds)
    ? candidate.alternateStationIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
    : [];

  const springFrostCandidate = Number(candidate.springFrostDay);
  const springFrostDay = Number.isFinite(springFrostCandidate)
    ? springFrostCandidate
    : DEFAULT_SPRING_FROST_DAY;

  const winterFrostCandidate = Number(candidate.winterFrostDay);
  const winterFrostDay = Number.isFinite(winterFrostCandidate)
    ? winterFrostCandidate
    : null;

  const avgWinterTempCandidate = Number(candidate.avgWinterTempF);
  const avgWinterTempF = Number.isFinite(avgWinterTempCandidate)
    ? avgWinterTempCandidate
    : null;

  const fetchedAt = typeof candidate.fetchedAt === 'string'
    ? candidate.fetchedAt
    : new Date().toISOString();

  const latitudeCandidate = Number(candidate.latitude);
  const latitude = Number.isFinite(latitudeCandidate) ? latitudeCandidate : null;

  const longitudeCandidate = Number(candidate.longitude);
  const longitude = Number.isFinite(longitudeCandidate) ? longitudeCandidate : null;

  const elevationCandidate = Number(candidate.elevationMeters);
  const elevationMeters = Number.isFinite(elevationCandidate) ? elevationCandidate : null;

  const hardinessZone = typeof candidate.hardinessZone === 'string'
    ? candidate.hardinessZone.trim() || null
    : null;

  if (!zip && !stationId) return null;

  return {
    zip,
    locationName,
    stationId,
    stationName,
    alternateStationIds,
    springFrostDay,
    winterFrostDay,
    avgWinterTempF,
    fetchedAt,
    latitude,
    longitude,
    elevationMeters,
    hardinessZone,
  };
}

function getWindowStartDay(window?: PlantScheduleWindow): number | undefined {
  if (!window) return undefined;
  if (typeof window.startDayLocalized === 'number') return window.startDayLocalized;
  return window.startDayDefault;
}

function applyFrostToWindow(window: PlantScheduleWindow | undefined, springFrostDay: number): PlantScheduleWindow | undefined {
  if (!window) return undefined;
  const localizedStart = springFrostDay + window.startOffsetFromSpringFrost;
  return { ...window, startDayLocalized: localizedStart };
}

function applyFrostToPeriods(periods: PlantPeriod[], springFrostDay: number): PlantPeriod[] {
  return periods.map(period => ({
    indoor: applyFrostToWindow(period.indoor, springFrostDay),
    transplant: applyFrostToWindow(period.transplant, springFrostDay),
    outdoor: applyFrostToWindow(period.outdoor, springFrostDay),
  }));
}

function buildPlantRecord(base: BasePlantDefinition, springFrostDay: number): Plant {
  const isOrnamental = base.plantType === 'flower' || base.plantType === 'ornamental';
  
  // For ornamental plants with no periods, create a minimal plant record
  if (isOrnamental && base.defaultPeriods.length === 0) {
    return {
      id: base.id,
      slug: base.slug,
      name: base.name,
      category: base.category,
      image: base.image,
      plantType: base.plantType,
      indoorOutdoor: 'Outdoor',
      minZone: base.minZone,
      maxZone: base.maxZone,
      bloomSeason: base.bloomSeason,
      description: base.description,
    };
  }

  // For vegetables and plants with periods
  const localizedPeriods = applyFrostToPeriods(base.defaultPeriods, springFrostDay);
  const indoor = firstWindow(localizedPeriods, 'indoor');
  const transplant = firstWindow(localizedPeriods, 'transplant');
  const outdoor = firstWindow(localizedPeriods, 'outdoor');

  const fallbackStart = springFrostDay || DEFAULT_SPRING_FROST_DAY;
  const earliestStart = getWindowStartDay(indoor)
    ?? getWindowStartDay(outdoor)
    ?? getWindowStartDay(transplant)
    ?? fallbackStart;
  const transplantStart = getWindowStartDay(transplant)
    ?? getWindowStartDay(outdoor)
    ?? getWindowStartDay(indoor)
    ?? earliestStart;
  const transplantDay = Math.max(transplantStart - earliestStart, 0);

  const daysToHarvest = estimateHarvestDays(base.category);
  const harvestDate = formatHarvestDate(earliestStart, daysToHarvest);

  return {
    id: base.id,
    slug: base.slug,
    name: base.name,
    category: base.category,
    image: base.image,
    plantType: base.plantType,
    startSeedIndoor: formatWindow(indoor),
    startSeedOutdoor: formatWindow(outdoor),
    transplantOutdoor: formatWindow(transplant),
    harvestDate,
    indoorOutdoor: summarizePlantingMode(base.defaultPeriods),
    daysToHarvest,
    transplantDay,
    minZone: base.minZone,
    maxZone: base.maxZone,
    defaultPeriods: localizedPeriods,
    bloomSeason: base.bloomSeason,
    description: base.description,
  };
}

function buildPlantDatabase(springFrostDay: number): Plant[] {
  const safeSpringFrost = Number.isFinite(springFrostDay) ? springFrostDay : DEFAULT_SPRING_FROST_DAY;
  return BASE_PLANTS.map(base => buildPlantRecord(base, safeSpringFrost));
}

function buildNoaaErrorMessage(error: unknown): string {
  const fallback = 'NOAA climate data is unavailable right now. Using default frost dates.';
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes('token missing')) {
      return 'NOAA API token missing. Set EXPO_PUBLIC_NOAA_TOKEN in your environment and restart the app.';
    }
    if (message.includes('401')) {
      return 'NOAA API rejected the provided token (401 Unauthorized). Double-check your API key and restart the app.';
    }
    if (message.includes('429')) {
      return 'NOAA API rate limit reached (429). Wait a few minutes before trying again.';
    }
    return `${fallback} (${message})`;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return `${fallback} (${error.trim()})`;
  }
  return fallback;
}

function plantSchedulesDiffer(a: Plant, b: Plant): boolean {
  return JSON.stringify(a.defaultPeriods) !== JSON.stringify(b.defaultPeriods);
}

function plantDiffers(a: Plant, b: Plant): boolean {
  return (
    a.startSeedIndoor !== b.startSeedIndoor
    || a.startSeedOutdoor !== b.startSeedOutdoor
    || a.transplantOutdoor !== b.transplantOutdoor
    || a.harvestDate !== b.harvestDate
    || a.daysToHarvest !== b.daysToHarvest
    || a.transplantDay !== b.transplantDay
    || plantSchedulesDiffer(a, b)
  );
}

const LEGACY_NAME_MAP: Record<string, string> = {
  tomato: 'Tomatoes',
  tomatoes: 'Tomatoes',
  pepper: 'Bell Peppers',
  peppers: 'Bell Peppers',
  cilantro: 'Cilantro',
  basil: 'Basil',
  lettuce: 'Lettuce',
  carrot: 'Carrots',
  carrots: 'Carrots',
};

function findPlantMatch(candidate: any, catalog: Plant[], slugMap?: Map<string, Plant>): Plant | undefined {
  if (!candidate || typeof candidate !== 'object') return undefined;

  if (typeof candidate.slug === 'string') {
    const bySlug = slugMap?.get(candidate.slug) ?? catalog.find(p => p.slug === candidate.slug);
    if (bySlug) return bySlug;
  }

  const rawName = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  if (!rawName) return undefined;

  const normalized = rawName.toLowerCase();
  const mapped = LEGACY_NAME_MAP[normalized] ?? rawName;
  const target = mapped.trim().toLowerCase();

  const direct = catalog.find((p: Plant) => p.name.toLowerCase() === target);
  if (direct) return direct;

  if (target.endsWith('s')) {
    const singular = target.replace(/s$/, '');
    const singularMatch = catalog.find((p: Plant) => p.name.toLowerCase() === singular);
    if (singularMatch) return singularMatch;
  } else {
    const plural = `${target}s`;
    const pluralMatch = catalog.find((p: Plant) => p.name.toLowerCase() === plural);
    if (pluralMatch) return pluralMatch;
  }

  return undefined;
}

type GardenContextType = {
  gardens: Garden[];
  addedPlants: Plant[];
  trackedPlants: TrackedPlant[];
  customWateringEntries: CustomWateringEntry[];
  plantDatabase: Plant[];
  location: LocationInfo | null;
  updateLocation: (info: LocationInfo | null) => void;
  lookupLocationByZip: (zip: string) => Promise<LocationInfo | null>;
  isLocationLoading: boolean;
  locationError: string | null;
  isGardenStateLoading: boolean;
  gardenStateError: string | null;
  weather: WeatherBundle | null;
  isWeatherLoading: boolean;
  weatherError: string | null;
  refreshWeather: (force?: boolean) => Promise<void> | void;
  temperatureUnit: 'F' | 'C';
  setTemperatureUnit: (unit: 'F' | 'C') => void;
  createGarden: (name: string, bedType: string, rows: number, cols: number) => number;
  placePlant: (gardenId: number, row: number, col: number, plant: Plant) => void;
  removePlant: (gardenId: number, row: number, col: number) => void;
  deleteGarden: (gardenId: number) => void;
  restoreGarden: (garden: Garden, index?: number) => void;
  addPlantToList: (plant: Plant) => void;
  removePlantFromList: (plantId: string) => void;
  startTracking: (plant: Plant) => void;
  removeTrackedPlant: (trackingId: string) => void;
  updateTrackedPlantPlantedDate: (trackingId: string, plantedDateISO: string) => void;
  logWatering: (trackingId: string) => void;
  updateWateringSettings: (trackingId: string, frequency: TrackedPlant['wateringFrequency'], intervalDays?: number) => void;
  toggleWateringReminder: (trackingId: string, enabled: boolean) => void;
  addCustomWateringEntry: (input: NewCustomWateringInput) => void;
  updateCustomWateringEntry: (entryId: string, updates: Partial<CustomWateringEntry>) => void;
  deleteCustomWateringEntry: (entryId: string) => void;
  markCustomWateringEntryWatered: (entryId: string) => void;
  addTimelineEntry: (trackingId: string, entry: PlantTimelineEntry) => void;
  updateTrackedPlantDetails: (trackingId: string, updates: { metadata?: PlantMetadata; timeline?: PlantTimelineEntry[]; notes?: string }) => void;
  calculateProgress: (plant: TrackedPlant) => {
    daysPassed: number;
    percentComplete: number;
    transplantReached: boolean;
    harvestReady: boolean;
    phase: 'indoor' | 'transplant' | 'outdoor' | 'harvest';
    nextMilestone: string;
  };
};

type NewCustomWateringInput = {
  name: string;
  frequencyDays: number;
  reminderEnabled?: boolean;
  linkedPlantId?: string;
  linkedPlantName?: string;
  linkedPlantCategory?: string;
  emoji?: string;
  location?: string;
  notes?: string;
  schedule?: {
    remindAtHour?: number;
  };
};

const GardenContext = createContext<GardenContextType | undefined>(undefined);

export function useGarden() {
  const ctx = useContext(GardenContext);
  if (!ctx) throw new Error('useGarden must be used within GardenProvider');
  return ctx;
}

export const GardenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [addedPlants, setAddedPlants] = useState<Plant[]>([]);
  const [trackedPlants, setTrackedPlants] = useState<TrackedPlant[]>([]);
  const [customWateringEntries, setCustomWateringEntries] = useState<CustomWateringEntry[]>([]);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGardenStateLoading, setIsGardenStateLoading] = useState(true);
  const [gardenStateError, setGardenStateError] = useState<string | null>(null);
  // Weather state
  const [weather, setWeather] = useState<WeatherBundle | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [temperatureUnit, setTemperatureUnitState] = useState<'F' | 'C'>('F');

  const persistCustomEntries = React.useCallback((updater: (prev: CustomWateringEntry[]) => CustomWateringEntry[]) => {
    setCustomWateringEntries(prev => {
      const next = updater(prev);
      AsyncStorage.setItem(CUSTOM_WATERING_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

const findLinkedPlant = (plantId: string | undefined, catalog: Plant[]): Plant | undefined => {
  if (!plantId) return undefined;
  return catalog.find(p => p.id === plantId);
};

  const STORAGE_KEY = '@adams_eden_state_v1';
  const WEATHER_STORAGE_KEY = '@adams_eden_weather_v1';
  const WEATHER_PREFS_KEY = '@adams_eden_weather_prefs_v1';

  const springFrostDay = location?.springFrostDay ?? DEFAULT_SPRING_FROST_DAY;
  const plantDatabase = React.useMemo(() => {
    console.log(`[GardenContext] Building plant database with spring frost day: ${springFrostDay} (${dayOfYearToDate(springFrostDay).toLocaleDateString()})`);
    return buildPlantDatabase(springFrostDay);
  }, [springFrostDay]);
  const plantBySlug = React.useMemo(() => {
    const map = new Map<string, Plant>();
    plantDatabase.forEach(plant => {
      map.set(plant.slug, plant);
    });
    return map;
  }, [plantDatabase]);

  const updateLocation = React.useCallback((info: LocationInfo | null) => {
    setLocation(info ? { ...info } : null);
    // Reset weather on location change
    setWeather(null);
  }, []);

  const toApiUnit = React.useCallback((u: 'F' | 'C'): 'fahrenheit' | 'celsius' => (u === 'F' ? 'fahrenheit' : 'celsius'), []);

  const isDailyStale = React.useCallback((bundle: any): boolean => {
    try {
      if (!bundle || !Array.isArray(bundle.daily) || bundle.daily.length === 0) return true;
      const first = bundle.daily[0];
      if (!first?.date) return true;
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const firstDate = new Date(first.date);
      // Compare dates ignoring time
      const firstStart = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate());
      return firstStart < todayStart;
    } catch {
      return true;
    }
  }, []);

  const buildLocationInfoFromRecord = React.useCallback((
    record: ZipStationRecord,
    overrides?: Partial<LocationInfo>,
  ): LocationInfo => ({
    zip: record.zip,
    locationName: record.location,
    stationId: overrides?.stationId || record.primaryStation.id,
    stationName: overrides?.stationName || record.primaryStation.name,
    alternateStationIds: overrides?.alternateStationIds || [...record.alternateStations],
    springFrostDay: overrides?.springFrostDay ?? DEFAULT_SPRING_FROST_DAY,
    winterFrostDay: overrides?.winterFrostDay ?? null,
    avgWinterTempF: overrides?.avgWinterTempF ?? null,
    fetchedAt: overrides?.fetchedAt ?? new Date().toISOString(),
    latitude: overrides?.latitude ?? record.latitude,
    longitude: overrides?.longitude ?? record.longitude,
    elevationMeters: overrides?.elevationMeters ?? record.elevationMeters,
    hardinessZone: overrides?.hardinessZone ?? DEFAULT_HARDINESS_ZONE,
  }), []);

  const lookupLocationByZip = React.useCallback(async (zip: string) => {
    const normalizedInput = typeof zip === 'string' ? zip.trim() : '';
    if (!normalizedInput) {
      setLocationError('Please enter a ZIP code.');
      return null;
    }

    setIsLocationLoading(true);
    setLocationError(null);

    try {
      const record = lookupZip(normalizedInput);
      if (!record) {
        throw new Error(`No matching NOAA station found for ZIP code ${normalizedInput}.`);
      }

      let locationSummary = buildLocationInfoFromRecord(record);

      try {
        const climate = await getNoaaNormalsForZip(record);
        const frostDay = climate.springFrostDay ?? DEFAULT_SPRING_FROST_DAY;
        console.log(`[GardenContext] NOAA climate data loaded for ZIP ${record.zip}: Spring frost day = ${frostDay} (${dayOfYearToDate(frostDay).toLocaleDateString()})`);
        locationSummary = buildLocationInfoFromRecord(record, {
          stationId: climate.usedStations[0] ?? record.primaryStation.id,
          springFrostDay: frostDay,
          winterFrostDay: climate.winterFrostDay,
          avgWinterTempF: climate.avgWinterTempF,
          fetchedAt: climate.fetchedAt,
        });
        setLocationError(null);
      } catch (climateError) {
        console.warn('Falling back to default frost day for ZIP', record.zip, climateError);
        setLocationError(buildNoaaErrorMessage(climateError));
      }

      updateLocation(locationSummary);
      return locationSummary;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to resolve ZIP code. Please try again later.';
      setLocationError(message);
      updateLocation(null);
      return null;
    } finally {
      setIsLocationLoading(false);
    }
  }, [buildLocationInfoFromRecord, updateLocation]);

  // Load temperature unit preference
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(WEATHER_PREFS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const u = parsed?.temperatureUnit === 'C' ? 'C' : 'F';
          setTemperatureUnitState(u);
        }
      } catch {}
    })();
  }, [WEATHER_PREFS_KEY]);

  // Fetch weather when we have a location with coordinates or unit changes
  useEffect(() => {
    let aborted = false;
    (async () => {
      if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') return;
      // Attempt to hydrate cached weather first
      try {
        const cachedRaw = await AsyncStorage.getItem(WEATHER_STORAGE_KEY);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed && parsed.fetchedAt && parsed.currentTempF !== undefined) {
            const cachedUnit: 'fahrenheit' | 'celsius' | undefined = parsed.unit;
            const desiredUnit = toApiUnit(temperatureUnit);
            const stale = isDailyStale(parsed) || (cachedUnit && cachedUnit !== desiredUnit);
            if (!stale) {
              setWeather(parsed);
            }
          }
        }
      } catch {}
      setIsWeatherLoading(true);
      try {
  const bundleRaw = await fetchWeather(location.latitude, location.longitude, false, toApiUnit(temperatureUnit));
  const bundle = { ...bundleRaw, conditionText: mapWeatherCodeToText(bundleRaw.currentCode) } as WeatherBundle;
        if (!aborted) {
          setWeather(bundle);
          setWeatherError(null);
          try { await AsyncStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(bundle)); } catch {}
        }
      } catch (e) {
        if (!aborted) {
          setWeatherError(e instanceof Error ? e.message : 'Failed to load weather');
        }
      } finally {
        if (!aborted) setIsWeatherLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, [location, temperatureUnit, WEATHER_STORAGE_KEY, toApiUnit, isDailyStale]);

  const refreshWeather = React.useCallback(async (force = true) => {
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') return;
    setIsWeatherLoading(true);
    try {
  const bundleRaw = await fetchWeather(location.latitude, location.longitude, force, toApiUnit(temperatureUnit));
  const bundle = { ...bundleRaw, conditionText: mapWeatherCodeToText(bundleRaw.currentCode) } as WeatherBundle;
  setWeather(bundle);
      setWeatherError(null);
      try { await AsyncStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(bundle)); } catch {}
    } catch (e) {
      setWeatherError(e instanceof Error ? e.message : 'Failed to refresh weather');
    } finally {
      setIsWeatherLoading(false);
    }
  }, [location, temperatureUnit, toApiUnit]);

  const setTemperatureUnit = React.useCallback((unit: 'F' | 'C') => {
    setTemperatureUnitState(unit);
    (async () => {
      try { await AsyncStorage.setItem(WEATHER_PREFS_KEY, JSON.stringify({ temperatureUnit: unit })); } catch {}
    })();
  }, [WEATHER_PREFS_KEY]);

  // Refresh on app resume to catch day rollover
  useEffect(() => {
    let lastState: AppStateStatus = AppState.currentState;
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (lastState.match(/inactive|background/) && nextState === 'active') {
        // On resume, if we have weather and it's stale for today, refresh
        try {
          if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') return;
          const cachedRaw = await AsyncStorage.getItem(WEATHER_STORAGE_KEY);
          let needsRefresh = true;
          if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw);
            const desiredUnit = toApiUnit(temperatureUnit);
            needsRefresh = isDailyStale(parsed) || (parsed?.unit && parsed.unit !== desiredUnit);
          }
          if (needsRefresh) {
            await refreshWeather(true);
          }
        } catch {}
      }
      lastState = nextState;
    });
    return () => {
      sub.remove();
    };
  }, [location, temperatureUnit, refreshWeather, isDailyStale, toApiUnit, WEATHER_STORAGE_KEY]);

  useEffect(() => {
    if (!plantDatabase.length) return;

    setGardens(prevGardens => {
      let gardensChanged = false;
      const nextGardens = prevGardens.map(garden => {
        let gridChanged = false;
        const nextGrid = garden.grid.map(row => row.map(cell => {
          if (!cell) return null;
          const refreshed = findPlantMatch(cell, plantDatabase, plantBySlug);
          if (!refreshed) return cell;
          if (plantDiffers(cell, refreshed)) {
            gridChanged = true;
            return { ...refreshed };
          }
          return cell;
        }));
        if (gridChanged) {
          gardensChanged = true;
          return { ...garden, grid: nextGrid };
        }
        return garden;
      });
      return gardensChanged ? nextGardens : prevGardens;
    });

    setAddedPlants(prevAdded => {
      let addedChanged = false;
      const nextAdded = prevAdded.map(plant => {
        const refreshed = findPlantMatch(plant, plantDatabase, plantBySlug);
        if (refreshed && plantDiffers(plant, refreshed)) {
          addedChanged = true;
          return { ...refreshed };
        }
        return plant;
      });
      return addedChanged ? nextAdded : prevAdded;
    });

    setTrackedPlants(prevTracked => {
      let trackedChanged = false;
      const nextTracked = prevTracked.map(tracked => {
        const refreshed = findPlantMatch(tracked, plantDatabase, plantBySlug);
        if (!refreshed) return tracked;
        const merged: TrackedPlant = {
          ...refreshed,
          trackingId: tracked.trackingId,
          seedPlantedDate: tracked.seedPlantedDate,
          daysGrown: tracked.daysGrown,
          plantedConfirmed: Boolean((tracked as any).plantedConfirmed),
          // Preserve watering data
          wateringFrequency: tracked.wateringFrequency || 'average',
          wateringIntervalDays: tracked.wateringIntervalDays || 4,
          lastWatered: tracked.lastWatered,
          wateringReminderEnabled: tracked.wateringReminderEnabled !== undefined ? tracked.wateringReminderEnabled : true,
        };
        if (plantDiffers(tracked, merged)) {
          trackedChanged = true;
          return merged;
        }
        return tracked;
      });
      return trackedChanged ? nextTracked : prevTracked;
    });
  }, [plantDatabase, plantBySlug]);

  // Load persisted state on mount
  useEffect(() => {
    (async () => {
      setIsGardenStateLoading(true);
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.gardens)) {
            const normalizedGardens = parsed.gardens.map((garden: any, idx: number): Garden => {
              const rows = Number.isInteger(garden?.rows) ? garden.rows : 0;
              const cols = Number.isInteger(garden?.cols) ? garden.cols : 0;
              const grid: (Plant | null)[][] = Array.isArray(garden?.grid)
                ? garden.grid.map((row: any[]) => (Array.isArray(row)
                  ? row.map(cell => {
                      const match = findPlantMatch(cell, plantDatabase, plantBySlug);
                      return match ? { ...match } : null;
                    })
                  : Array(cols).fill(null)))
                : Array.from({ length: rows }, () => Array(cols).fill(null));

              return {
                id: typeof garden?.id === 'number' ? garden.id : Date.now() + idx,
                name: typeof garden?.name === 'string' ? garden.name : `Garden ${idx + 1}`,
                bedType: typeof garden?.bedType === 'string' ? garden.bedType : 'Raised Bed',
                rows,
                cols,
                grid,
              };
            });
            setGardens(normalizedGardens);
          }

          if (Array.isArray(parsed.addedPlants)) {
            const normalizedAdded: Plant[] = parsed.addedPlants
              .map((plant: any) => findPlantMatch(plant, plantDatabase, plantBySlug))
              .filter((plant: Plant | undefined): plant is Plant => Boolean(plant))
              .map((plant: Plant) => ({ ...plant }));
            if (normalizedAdded.length) {
              setAddedPlants(normalizedAdded);
            }
          }

          if (Array.isArray(parsed.trackedPlants)) {
            const normalizedTracked: TrackedPlant[] = parsed.trackedPlants
              .map((tracked: any, idx: number): TrackedPlant | null => {
                const basePlant = findPlantMatch(tracked, plantDatabase, plantBySlug);
                if (!basePlant) return null;
                const trackingId = tracked?.trackingId
                  ? String(tracked.trackingId)
                  : `${basePlant.slug}-${Date.now()}-${idx}`;
                const seedPlantedDate = typeof tracked?.seedPlantedDate === 'string'
                  ? tracked.seedPlantedDate
                  : new Date().toISOString();
                const daysGrown = typeof tracked?.daysGrown === 'number' ? tracked.daysGrown : 0;
                return {
                  ...basePlant,
                  trackingId,
                  seedPlantedDate,
                  daysGrown,
                  plantedConfirmed: Boolean(tracked?.plantedConfirmed),
                  // Handle missing watering fields (backwards compatibility)
                  wateringFrequency: tracked?.wateringFrequency || 'average',
                  wateringIntervalDays: tracked?.wateringIntervalDays || 4,
                  lastWatered: tracked?.lastWatered,
                  wateringReminderEnabled: tracked?.wateringReminderEnabled !== undefined ? tracked.wateringReminderEnabled : true,
                } as TrackedPlant;
              })
              .filter((item: TrackedPlant | null): item is TrackedPlant => Boolean(item));
            if (normalizedTracked.length) {
              setTrackedPlants(normalizedTracked);
            }
          }

          if (parsed.location) {
            const normalizedLocation = normalizeLocation(parsed.location);
            if (normalizedLocation) {
              setLocation(normalizedLocation);
            }
          }
        }
        setGardenStateError(null);
      } catch (e) {
        console.warn('Failed to load saved garden state', e);
        setGardenStateError(e instanceof Error ? e.message : 'Failed to load saved garden state');
      } finally {
        setIsGardenStateLoading(false);
      }
    })();
  }, [STORAGE_KEY, plantDatabase, plantBySlug]);

  // Load custom watering entries
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CUSTOM_WATERING_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const hydrated: CustomWateringEntry[] = [];
          for (const entry of parsed) {
            const frequency = Math.max(1, Number(entry?.schedule?.frequencyDays ?? entry?.frequencyDays ?? 4));
            const safeEntry: CustomWateringEntry = {
              ...entry,
              schedule: {
                mode: 'interval',
                frequencyDays: frequency,
                remindAtHour: entry?.schedule?.remindAtHour,
              },
            };
            hydrated.push(await syncCustomEntryReminder(safeEntry));
          }
          setCustomWateringEntries(hydrated);
          AsyncStorage.setItem(CUSTOM_WATERING_STORAGE_KEY, JSON.stringify(hydrated)).catch(() => {});
        }
      } catch (e) {
        console.warn('Failed to load custom watering entries', e);
      }
    })();
  }, []);

  // Persist state whenever it changes
  useEffect(() => {
    (async () => {
      try {
        const payload = JSON.stringify({ gardens, addedPlants, trackedPlants, location });
        await AsyncStorage.setItem(STORAGE_KEY, payload);
      } catch (e) {
        console.warn('Failed to save garden state', e);
      }
    })();
  }, [gardens, addedPlants, trackedPlants, location]);

  // Schedule watering reminders when tracked plants change
  useEffect(() => {
    (async () => {
      try {
        for (const tp of trackedPlants) {
          if (tp.wateringReminderEnabled) {
            await rescheduleWateringReminderIfChanged(tp.trackingId, tp.lastWatered, tp.wateringIntervalDays || 4);
          } else {
            await cancelWateringReminder(tp.trackingId);
          }
        }
        
        // Check for overdue plants and send immediate reminders
        await checkOverdueWateringReminders(trackedPlants);
      } catch (e) {
        // Non-fatal
      }
    })();
  }, [trackedPlants]);

  // Firebase real-time sync for tracked plants
  const { user } = useAuth();
  useEffect(() => {
    if (!user) {
      // Clear tracked plants when logged out
      setTrackedPlants([]);
      return;
    }

    // Set up real-time listener for tracker collection
    const q = query(
      collection(db, 'users', user.id, 'tracker'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plants: TrackedPlant[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Map Firestore data to TrackedPlant format
        const plantName = data.plantName || data.commonName || 'Unknown Plant';
        const plantSlug = data.slug || (plantName ? plantName.toLowerCase().replace(/\s+/g, '-') : 'unknown');
        
        const metadata: PlantMetadata = {
          ...(data.metadata || {}),
          variety: data.metadata?.variety ?? data.variety ?? '',
          location: data.metadata?.location ?? data.location ?? '',
          notes: data.metadata?.notes ?? data.notes ?? '',
        };

        const timeline: PlantTimelineEntry[] = Array.isArray(data.timeline)
          ? data.timeline
          : [];

        const tracked: TrackedPlant = {
          id: data.plantId || data.id || docSnap.id,
          slug: plantSlug,
          name: plantName,
          category: data.category || 'vegetable',
          image: data.emoji || '🌱',
          indoorOutdoor: 'outdoor',
          minZone: data.minZone || 1,
          maxZone: data.maxZone || 13,
          variety: metadata.variety,
          source: metadata.source,
          potSize: metadata.potSize,
          soilMix: metadata.soilMix,
          fertilizerSchedule: metadata.fertilizerSchedule,
          location: metadata.location,
          notes: metadata.notes || '',
          // Use Firestore field names
          trackingId: docSnap.id,
          seedPlantedDate: data.plantedDate || data.seedPlantedDate || new Date().toISOString(),
          daysGrown: data.daysGrown || 0,
          plantedConfirmed: data.status === 'planted' || data.plantedConfirmed || false,
          daysToHarvest: data.daysToHarvest || 70,
          transplantDay: data.daysToTransplant,
          // Watering data
          wateringFrequency: data.wateringFrequency || 'average',
          wateringIntervalDays: data.wateringIntervalDays || 4,
          lastWatered: data.lastWatered,
          wateringReminderEnabled: data.wateringReminderEnabled !== undefined ? data.wateringReminderEnabled : true,
          metadata,
          timeline,
          // Merge with plant from database for full details if available
          ...(plantDatabase.find(p => p.slug === plantSlug) || {}),
        } as TrackedPlant;
        plants.push(tracked);
      });
      setTrackedPlants(plants);
    }, (error) => {
      console.error('Error syncing tracked plants:', error);
    });

    return () => unsubscribe();
  }, [user, plantDatabase]);

  const createGarden = (name: string, bedType: string, rows: number, cols: number) => {
    const gardenData: Garden = {
      id: Date.now(),
      name: name || `Garden ${gardens.length + 1}`,
      bedType,
      rows,
      cols,
      grid: Array(rows).fill(null).map(() => Array(cols).fill(null))
    };
    setGardens(prev => [...prev, gardenData]);
    return gardenData.id;
  };

  const placePlant = (gardenId: number, row: number, col: number, plant: Plant) => {
    setGardens(prev => prev.map(g => {
      if (g.id === gardenId) {
        const newGrid = g.grid.map(r => [...r]);
        newGrid[row][col] = plant;
        return { ...g, grid: newGrid };
      }
      return g;
    }));
    if (!addedPlants.find(p => p.id === plant.id)) setAddedPlants(prev => [...prev, { ...plant }]);
  };

  const removePlant = (gardenId: number, row: number, col: number) => {
    setGardens(prev => prev.map(g => {
      if (g.id === gardenId) {
        const newGrid = g.grid.map(r => [...r]);
        newGrid[row][col] = null;
        return { ...g, grid: newGrid };
      }
      return g;
    }));
  };

  const deleteGarden = (gardenId: number) => {
    setGardens(prev => prev.filter(g => g.id !== gardenId));
  };

  const restoreGarden = (garden: Garden, index?: number) => {
    setGardens(prev => {
      // If a garden with same id exists, replace it; otherwise insert at index or end.
      const existingIdx = prev.findIndex(g => g.id === garden.id);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = { ...garden };
        return copy;
      }
      if (typeof index === 'number' && index >= 0 && index <= prev.length) {
        const copy = [...prev];
        copy.splice(index, 0, { ...garden });
        return copy;
      }
      return [...prev, { ...garden }];
    });
  };

  const addPlantToList = (plant: Plant) => {
    setAddedPlants(prev => {
      if (prev.some(existing => existing.id === plant.id)) {
        return prev;
      }
      return [...prev, { ...plant }];
    });
  };

  const removePlantFromList = (plantId: string) => {
    setAddedPlants(prev => prev.filter(p => p.id !== plantId));
  };

  const startTracking = async (plant: Plant) => {
    if (!user) {
      console.warn('Cannot track plant: user not logged in');
      return;
    }

    try {
      const now = new Date().toISOString();
      const initialTimeline: PlantTimelineEntry[] = [
        {
          id: `log-${Date.now()}`,
          date: now,
          title: 'Tracking started',
          notes: 'Plant added to your garden tracker.',
          createdAt: now,
          category: 'observation',
          priority: 'low',
        },
      ];

      const metadata: PlantMetadata = {
        variety: '',
        source: '',
        potSize: '',
        soilMix: '',
        fertilizerSchedule: '',
        location: '',
        notes: '',
        customFields: [],
      };

      const newPlant = {
        plantId: plant.id,
        plantName: plant.name,
        slug: plant.slug,
        emoji: plant.image || '🌱',
        status: 'planned', // Start as planned, user can mark as planted later
        plantedDate: '',
        quantity: 1,
        location: '',
        notes: '',
        metadata,
        timeline: initialTimeline,
        milestones: [
          { name: 'Germination', reached: false, estimatedDays: 7 },
          { name: 'Seedling', reached: false, estimatedDays: 21 },
          { name: 'vegetative growth/flowering', reached: false, estimatedDays: (plant.daysToHarvest || 70) - 14 },
          { name: 'Ready to Harvest', reached: false, estimatedDays: plant.daysToHarvest || 70 }
        ],
        daysToHarvest: plant.daysToHarvest || 70,
        daysToGermination: 7,
        daysToTransplant: plant.transplantDay,
        wateringFrequency: 'average',
        wateringIntervalDays: 4,
        lastWatered: now, // Set initial watering to now
        wateringReminderEnabled: true,
        createdAt: now,
      };

      await addDoc(collection(db, 'users', user.id, 'tracker'), newPlant);
      // Real-time listener will update local state automatically
    } catch (error) {
      console.error('Error adding plant to tracker:', error);
    }
  };

  const removeTrackedPlant = async (trackingId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'users', user.id, 'tracker', trackingId));
      // Real-time listener will update local state automatically
    } catch (error) {
      console.error('Error removing tracked plant:', error);
    }
  };

  const updateTrackedPlantPlantedDate = async (trackingId: string, plantedDateISO: string) => {
    if (!user) return;

    // Normalize to ISO string
    let normalized = plantedDateISO;
    try {
      const d = new Date(plantedDateISO);
      if (!isNaN(d.getTime())) {
        normalized = d.toISOString();
      }
    } catch {}

    try {
      await updateDoc(doc(db, 'users', user.id, 'tracker', trackingId), {
        plantedDate: normalized,
        status: 'planted',
        plantedConfirmed: true,
        daysGrown: 0,
      });
      // Real-time listener will update local state automatically
    } catch (error) {
      console.error('Error updating planted date:', error);
    }
  };

  const logWatering = async (trackingId: string) => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      const timelineEntry: PlantTimelineEntry = {
        id: `log-${Date.now()}`,
        date: now,
        title: 'Watered',
        notes: 'Watering logged via Adams Eden.',
        createdAt: now,
        category: 'maintenance',
        priority: 'medium',
      };

      await updateDoc(doc(db, 'users', user.id, 'tracker', trackingId), {
        lastWatered: now,
        timeline: arrayUnion(timelineEntry),
      });
      
      // Cancel pending watering reminders since plant was just watered
      await onPlantWatered(trackingId);
      
      // Real-time listener will update local state automatically
    } catch (error) {
      console.error('Error logging watering:', error);
    }
  };

  const updateWateringSettings = async (
    trackingId: string,
    frequency: TrackedPlant['wateringFrequency'],
    intervalDays?: number
  ) => {
    if (!user) return;

    // If intervalDays is provided, use it; otherwise calculate from frequency
    let newInterval = intervalDays;
    if (newInterval === undefined) {
      switch (frequency) {
        case 'frequent':
          newInterval = 2;
          break;
        case 'average':
          newInterval = 4;
          break;
        case 'minimum':
          newInterval = 7;
          break;
        case 'custom':
          // Keep existing - need to fetch from current state
          const existing = trackedPlants.find(tp => tp.trackingId === trackingId);
          newInterval = existing?.wateringIntervalDays || 4;
          break;
      }
    }

    try {
      await updateDoc(doc(db, 'users', user.id, 'tracker', trackingId), {
        wateringFrequency: frequency,
        wateringIntervalDays: newInterval,
      });
      // Real-time listener will update local state automatically
    } catch (error) {
      console.error('Error updating watering settings:', error);
    }
  };

  const toggleWateringReminder = async (trackingId: string, enabled: boolean) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.id, 'tracker', trackingId), {
        wateringReminderEnabled: enabled,
      });
      // Real-time listener will update local state automatically
    } catch (error) {
      console.error('Error toggling watering reminder:', error);
    }
  };

  const addCustomWateringEntry = React.useCallback(async (input: NewCustomWateringInput) => {
    const linked = findLinkedPlant(input.linkedPlantId, plantDatabase);
    const now = new Date().toISOString();
    const baseEntry: CustomWateringEntry = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: input.name?.trim() || linked?.name || 'Untitled Plant',
      linkedPlantId: input.linkedPlantId,
      linkedPlantName: input.linkedPlantName ?? linked?.name,
      linkedPlantCategory: input.linkedPlantCategory ?? linked?.category,
      emoji: input.emoji ?? linked?.image ?? FALLBACK_EMOJI,
      location: input.location,
      schedule: {
        mode: 'interval',
        frequencyDays: Math.max(1, Math.round(input.frequencyDays || 4)),
        remindAtHour: input.schedule?.remindAtHour,
      },
      reminderEnabled: input.reminderEnabled ?? true,
      lastWateredAt: undefined,
      nextWateringAt: undefined,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    const hydrated = await syncCustomEntryReminder(baseEntry);
    persistCustomEntries(prev => [...prev, hydrated]);
  }, [plantDatabase, persistCustomEntries]);

  const updateCustomWateringEntry = React.useCallback(async (entryId: string, updates: Partial<CustomWateringEntry>) => {
    const existing = customWateringEntries.find(entry => entry.id === entryId);
    if (!existing) return;

    const linked = updates.linkedPlantId ? findLinkedPlant(updates.linkedPlantId, plantDatabase) : undefined;
    let updated: CustomWateringEntry = {
      ...existing,
      ...updates,
      linkedPlantName: updates.linkedPlantName ?? (updates.linkedPlantId ? linked?.name : existing.linkedPlantName),
      linkedPlantCategory: updates.linkedPlantCategory ?? (updates.linkedPlantId ? linked?.category : existing.linkedPlantCategory),
      emoji: updates.emoji ?? (updates.linkedPlantId ? linked?.image : existing.emoji),
      schedule: {
        ...existing.schedule,
        ...(updates.schedule ?? {}),
      },
      updatedAt: new Date().toISOString(),
    };

    if (updates.schedule?.frequencyDays) {
      updated.schedule.frequencyDays = Math.max(1, Math.round(updates.schedule.frequencyDays));
    }

    updated = await syncCustomEntryReminder(updated);
    persistCustomEntries(prev => prev.map(entry => (entry.id === entryId ? updated : entry)));
  }, [customWateringEntries, plantDatabase, persistCustomEntries]);

  const deleteCustomWateringEntry = React.useCallback(async (entryId: string) => {
    await cancelWateringReminder(`${CUSTOM_WATERING_NOTIFICATION_PREFIX}${entryId}`);
    persistCustomEntries(prev => prev.filter(entry => entry.id !== entryId));
  }, [persistCustomEntries]);

  const markCustomWateringEntryWatered = React.useCallback(async (entryId: string) => {
    const existing = customWateringEntries.find(entry => entry.id === entryId);
    if (!existing) return;
    let updated: CustomWateringEntry = {
      ...existing,
      lastWateredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updated = await syncCustomEntryReminder(updated);
    persistCustomEntries(prev => prev.map(entry => (entry.id === entryId ? updated : entry)));
  }, [customWateringEntries, persistCustomEntries]);

  const addTimelineEntry = async (trackingId: string, entry: PlantTimelineEntry) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.id, 'tracker', trackingId), {
        timeline: arrayUnion(entry),
      });
    } catch (error) {
      console.error('Error adding timeline entry:', error);
    }
  };

  const updateTrackedPlantDetails = async (
    trackingId: string,
    updates: { metadata?: PlantMetadata; timeline?: PlantTimelineEntry[]; notes?: string }
  ) => {
    if (!user) return;

    const payload: Record<string, any> = {};

    if (updates.metadata) {
      payload.metadata = updates.metadata;
      if (updates.metadata.variety !== undefined) payload.variety = updates.metadata.variety;
      if (updates.metadata.source !== undefined) payload.source = updates.metadata.source;
      if (updates.metadata.potSize !== undefined) payload.potSize = updates.metadata.potSize;
      if (updates.metadata.soilMix !== undefined) payload.soilMix = updates.metadata.soilMix;
      if (updates.metadata.fertilizerSchedule !== undefined) payload.fertilizerSchedule = updates.metadata.fertilizerSchedule;
      if (updates.metadata.location !== undefined) payload.location = updates.metadata.location;
      if (updates.metadata.notes !== undefined) payload.notes = updates.metadata.notes;
    }

    if (updates.timeline) {
      payload.timeline = updates.timeline;
    }

    if (updates.notes !== undefined) {
      payload.notes = updates.notes;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.id, 'tracker', trackingId), payload);
    } catch (error) {
      console.error('Error updating tracked plant details:', error);
    }
  };

  const calculateProgress = (plant: TrackedPlant) => {
    // Ornamental plants don't have harvest tracking
    const isOrnamental = plant.plantType === 'flower' || plant.plantType === 'ornamental';
    
    if (isOrnamental) {
      const seedDate = new Date(plant.seedPlantedDate);
      const now = new Date();
      const daysPassed = Math.max(Math.floor((now.getTime() - seedDate.getTime()) / (1000 * 60 * 60 * 24)), 0);
      
      return {
        daysPassed,
        percentComplete: 0,
        nextMilestone: plant.bloomSeason ? `Blooms: ${plant.bloomSeason}` : 'Growing',
        transplantReached: false,
        harvestReady: false,
        phase: 'outdoor' as const,
      };
    }

    // For vegetables with harvest tracking
    const seedDate = new Date(plant.seedPlantedDate);
    const now = new Date();
    const daysPassed = Math.max(Math.floor((now.getTime() - seedDate.getTime()) / (1000 * 60 * 60 * 24)), 0);
    const fallbackHarvest = estimateHarvestDays(plant.category);
    const totalDuration = (plant.daysToHarvest ?? 0) > 0 ? (plant.daysToHarvest ?? 0) : fallbackHarvest;
    const safeDuration = totalDuration > 0 ? totalDuration : Math.max(fallbackHarvest, 1);

    const transplantWindow = plant.defaultPeriods ? firstWindow(plant.defaultPeriods, 'transplant') : null;
    const indoorWindow = plant.defaultPeriods ? firstWindow(plant.defaultPeriods, 'indoor') : null;
    const transplantTarget = (plant.transplantDay ?? 0) > 0
      ? (plant.transplantDay ?? 0)
      : transplantWindow && indoorWindow
        ? Math.max(transplantWindow.startDayDefault - indoorWindow.startDayDefault, 0)
        : 0;

    const transplantReached = transplantTarget > 0 ? daysPassed >= transplantTarget : false;
    const harvestReady = daysPassed >= safeDuration;

    let phase: 'indoor' | 'transplant' | 'outdoor' | 'harvest';
    if (harvestReady) {
      phase = 'harvest';
    } else if (transplantReached) {
      phase = 'outdoor';
    } else if (transplantTarget > 0) {
      phase = 'transplant';
    } else if (plant.indoorOutdoor.toLowerCase().includes('indoor')) {
      phase = 'indoor';
    } else {
      phase = 'outdoor';
    }

    const percentComplete = Math.min((daysPassed / safeDuration) * 100, 100);

    let nextMilestone: string;
    if (!transplantReached && transplantTarget > 0) {
      const daysUntilTransplant = Math.max(transplantTarget - daysPassed, 0);
      nextMilestone = daysUntilTransplant === 0
        ? 'Transplant this week'
        : `Transplant in ${daysUntilTransplant} day${daysUntilTransplant === 1 ? '' : 's'}`;
    } else if (!harvestReady) {
      const daysUntilHarvest = Math.max(safeDuration - daysPassed, 0);
      nextMilestone = daysUntilHarvest === 0
        ? 'Harvest window opening'
        : `Harvest in ${daysUntilHarvest} day${daysUntilHarvest === 1 ? '' : 's'}`;
    } else {
      nextMilestone = 'Harvest ready';
    }

    return {
      daysPassed,
      percentComplete,
      transplantReached,
      harvestReady,
      phase,
      nextMilestone,
    };
  };

  return (
    <GardenContext.Provider
      value={{
        gardens,
        addedPlants,
        trackedPlants,
        customWateringEntries,
        plantDatabase,
        location,
        updateLocation,
        lookupLocationByZip,
        isLocationLoading,
        locationError,
        isGardenStateLoading,
        gardenStateError,
        weather,
        isWeatherLoading,
        weatherError,
        refreshWeather,
        temperatureUnit,
        setTemperatureUnit,
        createGarden,
        placePlant,
        removePlant,
        deleteGarden,
        restoreGarden,
        addPlantToList,
        removePlantFromList,
        startTracking,
        removeTrackedPlant,
        updateTrackedPlantPlantedDate,
        logWatering,
        updateWateringSettings,
        toggleWateringReminder,
        addCustomWateringEntry,
        updateCustomWateringEntry,
        deleteCustomWateringEntry,
        markCustomWateringEntryWatered,
        addTimelineEntry,
        updateTrackedPlantDetails,
        calculateProgress,
      }}
    >
      {children}
    </GardenContext.Provider>
  );
};

export default GardenContext;
