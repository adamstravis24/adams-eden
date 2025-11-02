import { Plant } from '../types/plants';

// Load companion data dynamically to avoid bundling issues
const companionData = require('../../assets/data/companion-plants.json');

export type CompanionStatus = 'good' | 'bad' | 'neutral';

export interface CompanionRelationship {
  plant: string;
  status: CompanionStatus;
  reason?: string;
}

export interface PlantRequirements {
  sunlight: 'full' | 'partial' | 'shade';
  water: 'low' | 'medium' | 'high';
  spacing: number; // inches
  height: 'low' | 'medium' | 'tall';
}

export interface SmartGridAlert {
  type: 'spacing' | 'sunlight' | 'water' | 'companion' | 'frost';
  severity: 'info' | 'warning' | 'error';
  message: string;
  affectedCells?: { row: number; col: number }[];
}

const companionPlantingData = companionData.companionPlantingData as Record<string, {
  goodCompanions: string[];
  badCompanions: string[];
  family: string;
  benefits: string;
}>;

const plantRequirements = companionData.plantRequirements as Record<string, PlantRequirements>;

/**
 * Check companion planting compatibility between two plants
 */
export function checkCompanionCompatibility(
  plant1: string,
  plant2: string
): CompanionStatus {
  const data1 = companionPlantingData[plant1];
  if (!data1) return 'neutral';

  if (data1.goodCompanions.includes(plant2)) return 'good';
  if (data1.badCompanions.includes(plant2)) return 'bad';
  
  return 'neutral';
}

/**
 * Get all companion relationships for a plant
 */
export function getCompanionRelationships(plantName: string): CompanionRelationship[] {
  const data = companionPlantingData[plantName];
  if (!data) return [];

  const relationships: CompanionRelationship[] = [];

  data.goodCompanions.forEach(companion => {
    relationships.push({
      plant: companion,
      status: 'good',
      reason: data.benefits,
    });
  });

  data.badCompanions.forEach(companion => {
    relationships.push({
      plant: companion,
      status: 'bad',
    });
  });

  return relationships;
}

/**
 * Get plant family for rotation planning
 */
export function getPlantFamily(plantName: string): string | null {
  const data = companionPlantingData[plantName];
  return data ? data.family : null;
}

/**
 * Get plant requirements for smart grid features
 */
export function getPlantRequirements(plantName: string): PlantRequirements | null {
  return plantRequirements[plantName] || null;
}

/**
 * Analyze garden grid for smart alerts
 */
export function analyzeGardenGrid(
  grid: (Plant | null)[][],
  cellSize: number = 72 // pixels per cell, ~6 inches
): SmartGridAlert[] {
  const alerts: SmartGridAlert[] = [];
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Check each planted cell
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const plant = grid[row][col];
      if (!plant) continue;

      const requirements = getPlantRequirements(plant.name);
      if (!requirements) continue;

      // Check spacing requirements
      const requiredCells = Math.ceil(requirements.spacing / 6); // Convert inches to cells
      if (requiredCells > 1) {
        // Check adjacent cells for overcrowding
        let adjacentPlants = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
              if (grid[newRow][newCol]) adjacentPlants++;
            }
          }
        }
        
        if (adjacentPlants >= 6 && requirements.spacing >= 18) {
          alerts.push({
            type: 'spacing',
            severity: 'warning',
            message: `${plant.name} needs ${requirements.spacing}" spacing. Consider more room for optimal growth.`,
            affectedCells: [{ row, col }],
          });
        }
      }

      // Check companion planting with adjacent cells
      const neighbors: { plant: Plant; row: number; col: number }[] = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const newRow = row + dr;
          const newCol = col + dc;
          if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
            const neighbor = grid[newRow][newCol];
            if (neighbor) {
              neighbors.push({ plant: neighbor, row: newRow, col: newCol });
            }
          }
        }
      }

      // Check compatibility with neighbors
      neighbors.forEach(neighbor => {
        const compatibility = checkCompanionCompatibility(plant.name, neighbor.plant.name);
        if (compatibility === 'bad') {
          alerts.push({
            type: 'companion',
            severity: 'error',
            message: `⚠️ ${plant.name} and ${neighbor.plant.name} are incompatible companions!`,
            affectedCells: [{ row, col }, { row: neighbor.row, col: neighbor.col }],
          });
        } else if (compatibility === 'good') {
          alerts.push({
            type: 'companion',
            severity: 'info',
            message: `✅ ${plant.name} and ${neighbor.plant.name} are excellent companions!`,
            affectedCells: [{ row, col }, { row: neighbor.row, col: neighbor.col }],
          });
        }
      });

      // Check water requirements grouping
      const waterNeighbors = neighbors.filter(n => {
        const nReq = getPlantRequirements(n.plant.name);
        return nReq && nReq.water !== requirements.water;
      });

      if (waterNeighbors.length >= 3) {
        alerts.push({
          type: 'water',
          severity: 'warning',
          message: `${plant.name} (${requirements.water} water) surrounded by plants with different water needs.`,
          affectedCells: [{ row, col }],
        });
      }

      // Check sunlight requirements
      if (requirements.sunlight === 'full') {
        // Check if surrounded by tall plants that might shade
        const tallNeighbors = neighbors.filter(n => {
          const nReq = getPlantRequirements(n.plant.name);
          return nReq && nReq.height === 'tall';
        });

        if (tallNeighbors.length >= 2 && requirements.height === 'low') {
          alerts.push({
            type: 'sunlight',
            severity: 'warning',
            message: `${plant.name} needs full sun but may be shaded by nearby tall plants.`,
            affectedCells: [{ row, col }],
          });
        }
      }
    }
  }

  // Remove duplicate companion alerts (since we check both directions)
  const uniqueAlerts = alerts.filter((alert, index, self) => {
    if (alert.type !== 'companion') return true;
    return index === self.findIndex(a => 
      a.type === 'companion' && a.message === alert.message
    );
  });

  return uniqueAlerts;
}

/**
 * Get companion planting suggestions when placing a new plant
 */
export function getCompanionSuggestions(
  plantName: string,
  nearbyPlants: string[]
): { good: string[]; bad: string[]; benefits: string } {
  const data = companionPlantingData[plantName];
  if (!data) return { good: [], bad: [], benefits: '' };

  const good = data.goodCompanions.filter(c => nearbyPlants.includes(c));
  const bad = data.badCompanions.filter(c => nearbyPlants.includes(c));

  return {
    good,
    bad,
    benefits: data.benefits,
  };
}

/**
 * Suggest rotation plan based on plant families
 */
export function suggestRotation(
  currentPlant: string,
  previousPlants: string[]
): { shouldRotate: boolean; reason: string; suggestions: string[] } {
  const currentFamily = getPlantFamily(currentPlant);
  if (!currentFamily) {
    return { shouldRotate: false, reason: 'Unknown plant family', suggestions: [] };
  }

  // Check if same family was recently planted
  const sameFamilyCount = previousPlants.filter(p => {
    const family = getPlantFamily(p);
    return family === currentFamily;
  }).length;

  if (sameFamilyCount > 0) {
    // Suggest plants from different families
    const suggestions: string[] = [];
    const allPlants = Object.keys(companionPlantingData);
    
    allPlants.forEach(plant => {
      const family = getPlantFamily(plant);
      if (family && family !== currentFamily && !suggestions.includes(plant)) {
        suggestions.push(plant);
      }
    });

    return {
      shouldRotate: true,
      reason: `Same family (${currentFamily}) planted recently. Rotate to prevent soil depletion.`,
      suggestions: suggestions.slice(0, 10),
    };
  }

  return { shouldRotate: false, reason: 'Good rotation', suggestions: [] };
}
