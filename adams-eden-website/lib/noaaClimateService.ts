/**
 * NOAA Climate Data Service
 * Fetches 30-year climate normals from NOAA's Climate Data Online (CDO) API
 * Used to determine frost dates and growing season information
 */

export type NoaaClimateSummary = {
  springFrostDay: number | null;  // Day of year (1-365) for last spring frost
  winterFrostDay: number | null;  // Day of year (1-365) for first fall frost
  avgWinterTempF: number | null;  // Average winter temperature in Fahrenheit
  usedStations: string[];         // NOAA station IDs used for this data
  fetchedAt: string;              // ISO timestamp of fetch
};

type FetchOptions = {
  forceRefresh?: boolean;
};

// Cache: Map from sorted station IDs to climate summary
const cache = new Map<string, NoaaClimateSummary>();

/**
 * Fetch climate normals from NOAA API for given weather stations
 */
async function fetchNoaaData(
  stations: string[],
  options?: FetchOptions
): Promise<NoaaClimateSummary> {
  console.log('Fetching NOAA data for stations:', stations);
  
  try {
    const stationsParam = stations.join(',');
    const url = new URL(`/api/noaa-climate`, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    url.searchParams.set('stations', stationsParam);
    if (options?.forceRefresh) {
      url.searchParams.set('forceRefresh', 'true');
    }
    
    console.log('Calling NOAA API route:', url.toString());
    
    const response = await fetch(url.toString());

    console.log('NOAA API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('NOAA API error response:', errorData);
      throw new Error(`NOAA API error: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json() as NoaaClimateSummary;
    console.log('NOAA API response data:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching NOAA data:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
}

/**
 * Get climate normals for a list of weather stations
 * Uses caching to avoid redundant API calls
 */
export async function getNoaaNormalsForStations(
  stations: string[],
  options?: FetchOptions
): Promise<NoaaClimateSummary> {
  // Create cache key from sorted station IDs
  const cacheKey = [...stations].sort().join(',');

  // Check cache unless force refresh
  if (!options?.forceRefresh && cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // Fetch from API - the API route already does the parsing
  const summary = await fetchNoaaData(stations, options);

  // Cache the result
  cache.set(cacheKey, summary);

  return summary;
}

/**
 * Get climate normals for a ZIP code (convenience wrapper)
 * Requires ZipStationRecord from zipStationLookup.ts
 */
export async function getNoaaNormalsForZip(
  record: { primaryStation: { id: string }; alternateStations: string[] },
  options?: FetchOptions
): Promise<NoaaClimateSummary> {
  const stations = [record.primaryStation.id, ...record.alternateStations];
  return getNoaaNormalsForStations(stations, options);
}

/**
 * Clear the cache (useful for testing or manual refresh)
 */
export function clearCache(): void {
  cache.clear();
}
