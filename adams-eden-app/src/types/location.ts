// Shared location-related types

export type LocationInfo = {
  zip: string;
  locationName: string;
  stationId: string;
  stationName: string;
  alternateStationIds: string[];
  springFrostDay: number;
  winterFrostDay: number | null;
  avgWinterTempF: number | null;
  fetchedAt: string;
  latitude?: number | null;
  longitude?: number | null;
  elevationMeters?: number | null;
  hardinessZone?: string | null;
};
