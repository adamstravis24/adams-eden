/**
 * ZIP Code to NOAA Weather Station Lookup
 * Maps US ZIP codes to nearest NOAA weather stations for climate data
 */

export type ZipStationRecord = {
  zip: string;
  location: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  primaryStation: {
    id: string;
    name: string;
    distanceMeters: number;
  };
  alternateStations: string[];
};

let zipData: ZipStationRecord[] | null = null;
let zipIndex: Map<string, ZipStationRecord> | null = null;
let isLoading = false;

/**
 * Load ZIP station data from public folder
 */
async function loadZipData(): Promise<void> {
  if (zipData && zipIndex) return; // Already loaded
  if (isLoading) {
    // Wait for ongoing load
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  isLoading = true;
  try {
    console.log('Fetching ZIP stations data from /zip-stations.json');
    const response = await fetch('/zip-stations.json');
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Failed to load ZIP data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Loaded data structure:', {
      hasZips: 'zips' in data,
      isArray: Array.isArray(data),
      keys: Object.keys(data),
      recordCount: data.recordCount
    });
    
    // Extract the zips array from the data object
    zipData = data.zips || data;
    console.log('ZIP data extracted:', {
      isArray: Array.isArray(zipData),
      length: zipData?.length,
      firstZip: zipData?.[0]?.zip,
      typeOf: typeof zipData
    });
    
    // Build index for fast lookup
    zipIndex = new Map();
    if (zipData && Array.isArray(zipData)) {
      console.log('Building index from array...');
      for (const record of zipData) {
        zipIndex.set(record.zip, record);
      }
      console.log('ZIP index built with', zipIndex.size, 'entries');
    } else {
      console.error('ZIP data is not an array:', typeof zipData);
      console.error('ZIP data value:', zipData);
      throw new Error('ZIP stations data is not in the expected format');
    }
  } catch (error) {
    console.error('Error loading ZIP station data:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    zipData = null;
    zipIndex = null;
    throw error;
  } finally {
    isLoading = false;
  }
}

/**
 * Normalize ZIP code to 5-digit format
 */
function normalizeZip(raw: string): string {
  const digits = raw.replace(/\D/g, ''); // Remove non-digits
  return digits.padStart(5, '0').slice(0, 5); // Pad to 5 chars
}

/**
 * Look up NOAA weather stations for a ZIP code
 * @param rawZip - ZIP code (can be 5 digits, with dash, etc.)
 * @returns ZipStationRecord or null if not found
 */
export async function lookupZip(rawZip: string): Promise<ZipStationRecord | null> {
  try {
    const normalized = normalizeZip(rawZip);
    console.log('Looking up ZIP via API:', normalized);
    
    const response = await fetch(`/api/zip-lookup?zip=${normalized}`);
    console.log('API response status:', response.status);
    
    if (response.status === 404) {
      return null; // ZIP not found
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const record = await response.json();
    console.log('ZIP record found:', record);
    return record;
  } catch (error) {
    console.error('Error looking up ZIP:', error);
    throw error;
  }
}

/**
 * Search for ZIP codes by partial match
 * @param query - Partial ZIP or location name
 * @param limit - Maximum number of results (default 10)
 * @returns Array of matching ZipStationRecords
 */
export async function searchZips(query: string, limit = 10): Promise<ZipStationRecord[]> {
  await loadZipData();
  
  if (!zipData) return [];
  
  const normalized = normalizeZip(query);
  const lowerQuery = query.toLowerCase();
  
  const matches: ZipStationRecord[] = [];
  
  for (const record of zipData) {
    if (matches.length >= limit) break;
    
    // Match by ZIP prefix or location name
    if (
      record.zip.startsWith(normalized) ||
      record.location.toLowerCase().includes(lowerQuery)
    ) {
      matches.push(record);
    }
  }
  
  return matches;
}

/**
 * Get all ZIP codes (use with caution - large dataset)
 */
export async function getAllZips(): Promise<ZipStationRecord[]> {
  await loadZipData();
  return zipData || [];
}
