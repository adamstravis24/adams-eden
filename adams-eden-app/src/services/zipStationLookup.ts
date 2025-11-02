import zipStations from '../../assets/data/zip-stations.json';

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

type ZipStationDataset = {
  zips: ZipStationRecord[];
};

const data = zipStations as ZipStationDataset;

const zipIndex = new Map<string, ZipStationRecord>();
for (const record of data.zips) {
  zipIndex.set(record.zip, record);
}

function normalizeZip(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return digits.padStart(5, '0').slice(0, 5);
}

export function lookupZip(rawZip: string): ZipStationRecord | null {
  const normalized = normalizeZip(rawZip);
  if (!normalized) return null;
  return zipIndex.get(normalized) ?? null;
}

export function searchZips(query: string, limit = 10): ZipStationRecord[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const results: ZipStationRecord[] = [];
  for (const record of zipIndex.values()) {
    if (record.zip.startsWith(normalizedQuery)) {
      results.push(record);
    } else if (record.location.toLowerCase().includes(normalizedQuery)) {
      results.push(record);
    }
    if (results.length >= limit) break;
  }
  return results;
}
