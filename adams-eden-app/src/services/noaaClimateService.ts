import { ZipStationRecord } from './zipStationLookup';

const NOAA_API_URL = 'https://www.ncdc.noaa.gov/cdo-web/api/v2/data';
const NOAA_DATASET_ID = 'NORMAL_ANN';
const NOAA_DATATYPES = [
  'ANN-TMIN-PRBLST-T28FP30',
  'ANN-TMIN-PRBFST-T28FP30',
  'DJF-TMIN-NORMAL',
] as const;

type NoaaDatatype = (typeof NOAA_DATATYPES)[number];

type NoaaApiResult = {
  date: string;
  datatype: NoaaDatatype | string;
  station: string;
  value: number;
};

type NoaaApiResponse = {
  results?: NoaaApiResult[];
};

export type NoaaClimateSummary = {
  springFrostDay: number | null;
  winterFrostDay: number | null;
  avgWinterTempF: number | null;
  usedStations: string[];
  fetchedAt: string;
};

const cache = new Map<string, NoaaClimateSummary>();

function getApiToken(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_NOAA_TOKEN ??
    process.env.EXPO_PUBLIC_NOAA_API_TOKEN ??
    process.env.NOAA_TOKEN ??
    process.env.NOAA_API_TOKEN
  );
}

function buildCacheKey(stations: string[]) {
  return stations
    .map(station => station.trim())
    .filter(Boolean)
    .sort()
    .join('|');
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

function parseResults(results: NoaaApiResult[]): Pick<NoaaClimateSummary, 'springFrostDay' | 'winterFrostDay' | 'avgWinterTempF'> {
  const springValues = results
    .filter(entry => entry.datatype === 'ANN-TMIN-PRBLST-T28FP30')
    .map(entry => entry.value)
    .filter(value => Number.isFinite(value));

  const winterValues = results
    .filter(entry => entry.datatype === 'ANN-TMIN-PRBFST-T28FP30')
    .map(entry => entry.value)
    .filter(value => Number.isFinite(value));

  const winterTempValues = results
    .filter(entry => entry.datatype === 'DJF-TMIN-NORMAL')
    .map(entry => entry.value)
    .filter(value => Number.isFinite(value));

  const springFrostDayAverage = average(springValues);
  const winterFrostDayAverage = average(winterValues);
  const winterTempAverage = average(winterTempValues);

  return {
    springFrostDay: springFrostDayAverage !== null ? Math.round(springFrostDayAverage) : null,
    winterFrostDay: winterFrostDayAverage !== null ? Math.round(winterFrostDayAverage) : null,
    avgWinterTempF: winterTempAverage !== null ? Number((winterTempAverage / 10).toFixed(1)) : null,
  };
}

type FetchOptions = {
  signal?: AbortSignal;
};

async function fetchNoaaData(stations: string[], options?: FetchOptions): Promise<NoaaApiResult[]> {
  const token = getApiToken();
  if (!token) {
    throw new Error('NOAA API token missing. Set EXPO_PUBLIC_NOAA_TOKEN in your environment.');
  }

  const params = new URLSearchParams({
    datasetid: NOAA_DATASET_ID,
    startdate: '2010-01-01',
    enddate: '2010-01-01',
    limit: '1000',
  });

  NOAA_DATATYPES.forEach(datatype => params.append('datatypeid', datatype));
  stations.forEach(stationId => params.append('stationid', stationId));

  const response = await fetch(`${NOAA_API_URL}?${params.toString()}`, {
    headers: {
      token,
    },
    signal: options?.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NOAA request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const payload = (await response.json()) as NoaaApiResponse;
  return payload.results ?? [];
}

export async function getNoaaNormalsForStations(stations: string[], options?: FetchOptions): Promise<NoaaClimateSummary> {
  const sanitizedStations = stations.map(station => station.trim()).filter(Boolean);
  if (!sanitizedStations.length) {
    throw new Error('At least one station ID is required');
  }

  const cacheKey = buildCacheKey(sanitizedStations);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const results = await fetchNoaaData(sanitizedStations, options);
    const parsed = parseResults(results);
    const summary: NoaaClimateSummary = {
      ...parsed,
      usedStations: sanitizedStations,
      fetchedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, summary);
    return summary;
  } catch (error) {
    console.warn('Failed to fetch NOAA normals', error);
    throw error;
  }
}

export async function getNoaaNormalsForZip(record: ZipStationRecord, options?: FetchOptions): Promise<NoaaClimateSummary> {
  const stations = [
    record.primaryStation.id,
    ...record.alternateStations,
  ];
  return getNoaaNormalsForStations(stations, options);
}
