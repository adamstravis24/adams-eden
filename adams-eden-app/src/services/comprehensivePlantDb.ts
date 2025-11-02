/**
 * Comprehensive Plant Database Service
 * 
 * Provides search, filter, and query capabilities for the curated 1,000-plant database.
 * Falls back to Trefle API for plants not in local database.
 */

import { ComprehensivePlant, ComprehensivePlantDatabase } from '../types/plants';
import comprehensiveDbData from '../../assets/data/comprehensive-plant-database.json';

// Type assertion for the imported JSON
const comprehensiveDb = comprehensiveDbData as ComprehensivePlantDatabase;

export interface PlantSearchOptions {
  query?: string;
  category?: string;
  edible?: boolean;
  sunlight?: string;
  watering?: string;
  hardiness?: number;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface PlantSearchResult {
  plants: ComprehensivePlant[];
  total: number;
  hasMore: boolean;
}

/**
 * Search plants in local database
 */
export function searchPlants(options: PlantSearchOptions = {}): PlantSearchResult {
  let filtered = [...comprehensiveDb.plants];
  const { query, category, edible, sunlight, watering, hardiness, type, limit = 50, offset = 0 } = options;
  
  // Text search (common name, scientific name, category)
  if (query && query.trim()) {
    const searchTerm = query.toLowerCase().trim();
    filtered = filtered.filter(plant => 
      plant.commonName.toLowerCase().includes(searchTerm) ||
      plant.scientificName.toLowerCase().includes(searchTerm) ||
      plant.commonNames.some(name => name.toLowerCase().includes(searchTerm)) ||
      plant.category.toLowerCase().includes(searchTerm) ||
      plant.family.toLowerCase().includes(searchTerm)
    );
  }
  
  // Filter by category
  if (category) {
    filtered = filtered.filter(plant => plant.category.toLowerCase() === category.toLowerCase());
  }
  
  // Filter by edible
  if (edible !== undefined) {
    filtered = filtered.filter(plant => plant.edible === edible);
  }
  
  // Filter by sunlight
  if (sunlight) {
    filtered = filtered.filter(plant => plant.care.sunlight === sunlight);
  }
  
  // Filter by watering
  if (watering) {
    filtered = filtered.filter(plant => plant.care.watering === watering);
  }
  
  // Filter by hardiness zone
  if (hardiness !== undefined) {
    filtered = filtered.filter(plant => {
      const min = plant.care.hardiness.min;
      const max = plant.care.hardiness.max;
      if (min === null || max === null) return true; // Include if no hardiness data
      return hardiness >= min && hardiness <= max;
    });
  }
  
  // Filter by type
  if (type) {
    filtered = filtered.filter(plant => plant.type === type);
  }
  
  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);
  
  return {
    plants: paginated,
    total,
    hasMore: offset + limit < total
  };
}

/**
 * Get a single plant by ID
 */
export function getPlantById(id: string): ComprehensivePlant | undefined {
  return comprehensiveDb.plants.find(plant => plant.id === id);
}

/**
 * Get a plant by common name
 */
export function getPlantByName(name: string): ComprehensivePlant | undefined {
  const searchTerm = name.toLowerCase().trim();
  return comprehensiveDb.plants.find(plant => 
    plant.commonName.toLowerCase() === searchTerm ||
    plant.commonNames.some(n => n.toLowerCase() === searchTerm)
  );
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  const categories = new Set(comprehensiveDb.plants.map(p => p.category));
  return Array.from(categories).sort();
}

/**
 * Get companion plants for a given plant
 */
export function getCompanionPlants(plantId: string): ComprehensivePlant[] {
  const plant = getPlantById(plantId);
  if (!plant || !plant.companionPlants.length) return [];
  
  const companions: ComprehensivePlant[] = [];
  for (const companionName of plant.companionPlants) {
    const companion = getPlantByName(companionName);
    if (companion) companions.push(companion);
  }
  
  return companions;
}

/**
 * Get plants to avoid near a given plant
 */
export function getAvoidPlants(plantId: string): ComprehensivePlant[] {
  const plant = getPlantById(plantId);
  if (!plant || !plant.avoidPlants?.length) return [];
  
  const avoid: ComprehensivePlant[] = [];
  for (const avoidName of plant.avoidPlants) {
    const avoidPlant = getPlantByName(avoidName);
    if (avoidPlant) avoid.push(avoidPlant);
  }
  
  return avoid;
}

/**
 * Get plants by category
 */
export function getPlantsByCategory(category: string): ComprehensivePlant[] {
  return comprehensiveDb.plants.filter(p => 
    p.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get database statistics
 */
export function getDatabaseStats() {
  return {
    version: comprehensiveDb.version,
    totalPlants: comprehensiveDb.plantCount,
    categories: comprehensiveDb.categories || {},
    sources: comprehensiveDb.sources,
    lastUpdated: comprehensiveDb.generatedAt
  };
}

/**
 * Check if a plant exists in local database
 */
export function isPlantInDatabase(nameOrId: string): boolean {
  const plant = getPlantById(nameOrId) || getPlantByName(nameOrId);
  return plant !== undefined;
}

/**
 * Get random plants (for suggestions)
 */
export function getRandomPlants(count: number = 5): ComprehensivePlant[] {
  const shuffled = [...comprehensiveDb.plants].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get popular plants (hardcoded list of most common)
 */
export function getPopularPlants(limit: number = 10): ComprehensivePlant[] {
  const popularNames = [
    'Tomato', 'Lettuce', 'Cucumber', 'Bell Pepper', 'Carrot',
    'Basil', 'Rosemary', 'Mint', 'Marigold', 'Sunflower'
  ];
  
  const plants: ComprehensivePlant[] = [];
  for (const name of popularNames) {
    const plant = getPlantByName(name);
    if (plant) plants.push(plant);
    if (plants.length >= limit) break;
  }
  
  return plants;
}

/**
 * Normalize plant name for searching
 */
export function normalizePlantName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
}

/**
 * Find best match for a plant name (fuzzy search)
 */
export function findBestMatch(searchTerm: string): ComprehensivePlant | undefined {
  const normalized = normalizePlantName(searchTerm);
  
  // Exact match
  let plant = comprehensiveDb.plants.find(p => 
    normalizePlantName(p.commonName) === normalized
  );
  if (plant) return plant;
  
  // Starts with
  plant = comprehensiveDb.plants.find(p => 
    normalizePlantName(p.commonName).startsWith(normalized)
  );
  if (plant) return plant;
  
  // Contains
  plant = comprehensiveDb.plants.find(p => 
    normalizePlantName(p.commonName).includes(normalized)
  );
  if (plant) return plant;
  
  // Scientific name match
  plant = comprehensiveDb.plants.find(p => 
    normalizePlantName(p.scientificName).includes(normalized)
  );
  
  return plant;
}

export default {
  searchPlants,
  getPlantById,
  getPlantByName,
  getCategories,
  getCompanionPlants,
  getAvoidPlants,
  getPlantsByCategory,
  getDatabaseStats,
  isPlantInDatabase,
  getRandomPlants,
  getPopularPlants,
  findBestMatch,
};
