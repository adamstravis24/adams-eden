// Shared plant and schedule related TypeScript types extracted from GardenContext

export type RawScheduleWindow = {
  rawStart: string;
  startOffsetFromSpringFrost: number;
  startDayDefault: number;
  duration: number;
};

export type RawPeriod = {
  indoor: RawScheduleWindow | null;
  transplant: RawScheduleWindow | null;
  outdoor: RawScheduleWindow | null;
};

export type RawPlant = {
  name: string;
  category: string;
  minZone: number;
  maxZone: number;
  defaultPeriods: RawPeriod[];
};

export type RawPlantDataset = {
  source: string;
  license: string;
  generatedAt: string;
  plantCount: number;
  plants: RawPlant[];
};

export type PlantScheduleWindow = RawScheduleWindow & {
  startDayLocalized?: number;
};

export type PlantPeriod = {
  indoor?: PlantScheduleWindow;
  transplant?: PlantScheduleWindow;
  outdoor?: PlantScheduleWindow;
};

export type Plant = {
  id: string;
  slug: string;
  name: string;
  category: string;
  image: string;
  plantType?: 'vegetable' | 'flower' | 'herb' | 'ornamental'; // Type of plant
  startSeedIndoor?: string; // Optional for ornamentals
  startSeedOutdoor?: string; // Optional for ornamentals
  transplantOutdoor?: string; // Optional for ornamentals
  harvestDate?: string; // Optional - only for harvestable plants
  indoorOutdoor: string;
  daysToHarvest?: number; // Optional - only for harvestable plants
  transplantDay?: number; // Optional for ornamentals
  minZone: number;
  maxZone: number;
  defaultPeriods?: PlantPeriod[]; // Optional for simple ornamentals
  description?: string; // Optional description for flowers
  bloomSeason?: string; // Optional - when flowers bloom
};

export type TrackedPlant = Plant & {
  trackingId: string;
  seedPlantedDate: string;
  daysGrown: number;
  plantedConfirmed: boolean;
  // Watering reminder fields
  wateringFrequency: 'frequent' | 'average' | 'minimum' | 'custom'; // Auto-populated from plant data or user-set
  wateringIntervalDays: number; // Days between watering (e.g., 2, 5, 7)
  lastWatered?: string; // ISO date string of last watering
  wateringReminderEnabled: boolean; // Whether to show reminders
};

export type Garden = {
  id: number;
  name: string;
  bedType: string;
  rows: number;
  cols: number;
  grid: (Plant | null)[][];
};

// ===== COMPREHENSIVE PLANT DATABASE TYPES =====

export interface ComprehensivePlantCare {
  watering: 'minimal' | 'moderate' | 'frequent';
  sunlight: 'full_shade' | 'partial_shade' | 'partial_sun' | 'full_sun';
  hardiness: {
    min: number | null;
    max: number | null;
  };
  soilType: string[];
  soilPH: {
    min: number | null;
    max: number | null;
  };
  fertilizer: string;
  spacing: string;
  depth: string;
}

export interface ComprehensivePlantDimensions {
  min: number | null;
  max: number | null;
  unit: 'cm' | 'in';
}

export interface ComprehensivePlant {
  id: string;
  commonName: string;
  commonNames: string[];
  scientificName: string;
  family: string;
  genus: string;
  category: string;
  
  // Images
  thumbnail: string;
  images: string[];
  emoji?: string; // Emoji representation of the plant
  
  // Care information
  care: ComprehensivePlantCare;
  
  // Plant characteristics
  type: 'annual' | 'perennial' | 'biennial' | '';
  edible: boolean;
  edibleParts: string[];
  toxic: boolean;
  toxicTo: string[];
  
  // Growth information
  height: ComprehensivePlantDimensions;
  spread: ComprehensivePlantDimensions;
  growthRate: 'slow' | 'moderate' | 'fast' | '';
  
  // Timing
  bloomTime: string[];
  harvestTime: string[];
  daysToMaturity: number | null;
  
  // Ecological
  native: string[];
  invasive: boolean;
  drought: boolean;
  deer: boolean;
  attracts: string[];
  
  // Companion planting
  companionPlants: string[];
  avoidPlants?: string[];
  
  // Pest & disease
  pests?: string[];
  diseases?: string[];
  pestRepellent?: string[];
  
  // Metadata
  source: string;
  sourceId: string;
  lastUpdated: string;
}

export interface ComprehensivePlantDatabase {
  version: string;
  generatedAt: string;
  plantCount: number;
  sources: string[];
  license: string;
  attribution: string;
  categories?: Record<string, number>;
  plants: ComprehensivePlant[];
}
