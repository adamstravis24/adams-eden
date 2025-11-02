import { TrackedPlant } from '../types/plants';

/**
 * Weather-aware watering reminder service
 * Integrates temperature data to adjust watering urgency
 */

export type WateringUrgency = 'overdue' | 'urgent' | 'due-soon' | 'good' | 'recently-watered';

export type WateringStatus = {
  urgency: WateringUrgency;
  daysUntilNextWatering: number;
  daysSinceLastWatering: number;
  message: string;
  color: string; // For UI color coding
  shouldNotify: boolean; // Whether to send a notification
};

/**
 * Get default watering interval based on frequency category
 */
export function getDefaultWateringInterval(frequency: TrackedPlant['wateringFrequency']): number {
  switch (frequency) {
    case 'frequent':
      return 2; // Every 2 days
    case 'average':
      return 4; // Every 4 days
    case 'minimum':
      return 7; // Every 7 days
    case 'custom':
      return 4; // Default to average if custom not set
    default:
      return 4;
  }
}

/**
 * Calculate days since last watering
 */
function getDaysSinceWatering(lastWatered?: string): number {
  if (!lastWatered) return 999; // Never watered = very high number
  const lastWateredDate = new Date(lastWatered);
  const now = new Date();
  const diffMs = now.getTime() - lastWateredDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Adjust watering urgency based on weather conditions
 * Hot days (>85°F) increase urgency, cool days decrease it
 */
function getWeatherAdjustment(temperatureF?: number): number {
  if (!temperatureF) return 0;
  
  if (temperatureF >= 95) return -2; // Very hot: check 2 days earlier
  if (temperatureF >= 85) return -1; // Hot: check 1 day earlier
  if (temperatureF <= 65) return 1;  // Cool: can wait 1 day longer
  return 0; // Normal temps: no adjustment
}

/**
 * Calculate watering status for a tracked plant
 * Integrates weather data for smart reminders
 */
export function getWateringStatus(
  plant: TrackedPlant,
  currentTempF?: number
): WateringStatus {
  const daysSince = getDaysSinceWatering(plant.lastWatered);
  const baseInterval = plant.wateringIntervalDays || getDefaultWateringInterval(plant.wateringFrequency);
  const weatherAdjustment = getWeatherAdjustment(currentTempF);
  const adjustedInterval = Math.max(1, baseInterval + weatherAdjustment);
  
  const daysUntilNext = adjustedInterval - daysSince;
  const isOverdue = daysSince > adjustedInterval;
  const isDueSoon = daysUntilNext <= 1 && daysUntilNext >= 0;
  const isUrgent = daysSince >= adjustedInterval && currentTempF && currentTempF >= 85;
  
  let urgency: WateringUrgency;
  let message: string;
  let color: string;
  let shouldNotify: boolean = false;

  if (isOverdue && daysSince > adjustedInterval + 2) {
    urgency = 'overdue';
    message = `Watered ${daysSince} day${daysSince === 1 ? '' : 's'} ago - Overdue!`;
    color = '#dc2626'; // Red
    shouldNotify = true;
  } else if (isUrgent) {
    urgency = 'urgent';
    message = `Watered ${daysSince} day${daysSince === 1 ? '' : 's'} ago - Hot day (${Math.round(currentTempF!)}°F)`;
    color = '#f97316'; // Orange
    shouldNotify = true;
  } else if (isOverdue) {
    urgency = 'overdue';
    message = `Watered ${daysSince} day${daysSince === 1 ? '' : 's'} ago - Due now`;
    color = '#dc2626'; // Red
    shouldNotify = true;
  } else if (isDueSoon) {
    urgency = 'due-soon';
    message = daysSince === 0 
      ? 'Watered today' 
      : `Watered ${daysSince} day${daysSince === 1 ? '' : 's'} ago - ${daysUntilNext === 0 ? 'Water today' : `Due in ${daysUntilNext} day`}`;
    color = '#eab308'; // Yellow
    shouldNotify = daysUntilNext === 0;
  } else if (daysSince === 0) {
    urgency = 'recently-watered';
    message = 'Watered today';
    color = '#22c55e'; // Green
    shouldNotify = false;
  } else if (daysSince === 1) {
    urgency = 'recently-watered';
    message = 'Watered 1 day ago';
    color = '#22c55e'; // Green
    shouldNotify = false;
  } else {
    urgency = 'good';
    message = `Watered ${daysSince} day${daysSince === 1 ? '' : 's'} ago`;
    color = '#10b981'; // Green
    shouldNotify = false;
  }

  // Add weather context to message if temperature affects schedule
  if (weatherAdjustment !== 0 && currentTempF) {
    if (weatherAdjustment < 0) {
      message += ` (heat adjusted)`;
    } else {
      message += ` (cool weather)`;
    }
  }

  return {
    urgency,
    daysUntilNextWatering: daysUntilNext,
    daysSinceLastWatering: daysSince,
    message,
    color,
    shouldNotify: shouldNotify && plant.wateringReminderEnabled,
  };
}

/**
 * Get a friendly display string for watering frequency
 */
export function getFrequencyDisplayName(frequency: TrackedPlant['wateringFrequency']): string {
  switch (frequency) {
    case 'frequent':
      return 'Frequent (every 2 days)';
    case 'average':
      return 'Average (every 4 days)';
    case 'minimum':
      return 'Minimal (weekly)';
    case 'custom':
      return 'Custom schedule';
    default:
      return 'Average';
  }
}

/**
 * Check if any plants need watering and return notification message
 */
export function getWateringNotifications(
  plants: TrackedPlant[],
  currentTempF?: number
): { plant: TrackedPlant; status: WateringStatus }[] {
  return plants
    .map(plant => ({
      plant,
      status: getWateringStatus(plant, currentTempF),
    }))
    .filter(({ status }) => status.shouldNotify);
}
