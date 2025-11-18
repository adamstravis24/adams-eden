import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeatherBundle, fetchWeather } from './weatherService';

const WATERING_MAP_KEY = '@adams_eden_watering_schedules_v1';
const WEATHER_CACHE_KEY = '@adams_eden_weather_v1'; // same as GardenContext
const LOCATION_KEY = '@adams_eden_state_v1'; // GardenContext persists state here

const ANDROID_NOTIFICATION_COLOR = '#16a34a';

function classifyFrost(minTempF: number | undefined) {
  if (typeof minTempF !== 'number' || Number.isNaN(minTempF)) {
    return null;
  }
  const rounded = Math.round(minTempF);
  if (rounded <= 32) {
    return { type: 'freeze', rounded };
  }
  if (rounded <= 36) {
    return { type: 'frost', rounded };
  }
  return { type: 'none', rounded };
}

// Calculate temperature-adjusted watering interval
async function getTemperatureAdjustedInterval(baseIntervalDays: number): Promise<number> {
  try {
    // Get location from GardenContext persistence
    const raw = await AsyncStorage.getItem(LOCATION_KEY);
    if (!raw) return baseIntervalDays;
    
    const parsed = JSON.parse(raw);
    const location = parsed?.location;
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return baseIntervalDays;
    }

    // Fetch current weather
    const bundle = await fetchWeather(location.latitude, location.longitude, true, 'fahrenheit');
    const today = bundle.daily?.[0];
    
    if (today && typeof today.maxF === 'number') {
      const maxTemp = today.maxF;
      
      // If temperature is above 92°F, reduce watering interval by 30-50%
      if (maxTemp > 92) {
        const reduction = maxTemp > 100 ? 0.5 : 0.3; // More reduction for extreme heat
        const adjusted = Math.max(1, Math.round(baseIntervalDays * (1 - reduction)));
        console.log(`Hot weather detected (${maxTemp}°F), adjusting watering interval from ${baseIntervalDays} to ${adjusted} days`);
        return adjusted;
      }
    }
  } catch (e) {
    console.warn('Failed to adjust watering interval for temperature:', e);
  }
  
  return baseIntervalDays;
}

export const WEATHER_TASK = 'adamseden-weather-check';

// Show notifications while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function initializeNotifications() {
  // Request permissions
  const settings = await Notifications.getPermissionsAsync();
  if (!settings.granted) {
    await Notifications.requestPermissionsAsync();
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: undefined,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: ANDROID_NOTIFICATION_COLOR,
    });
  }
}

function atHourLocal(date: Date, hour24: number) {
  const d = new Date(date);
  d.setHours(hour24, 0, 0, 0);
  return d;
}

function computeNextWateringDate(lastWateredISO: string | undefined, intervalDays: number, hourLocal = 9) {
  const base = lastWateredISO ? new Date(lastWateredISO) : new Date();
  const next = new Date(base);
  next.setDate(next.getDate() + Math.max(intervalDays, 1));
  return atHourLocal(next, hourLocal);
}

export type WateringSchedule = {
  trackingId: string;
  identifiers: string[]; // Multiple notification IDs for escalating reminders
  nextISO: string;
  baseIntervalDays: number;
  adjustedIntervalDays: number;
  lastWateredISO?: string;
};

async function loadWateringMap(): Promise<Record<string, WateringSchedule>> {
  try {
    const raw = await AsyncStorage.getItem(WATERING_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveWateringMap(map: Record<string, WateringSchedule>) {
  try { await AsyncStorage.setItem(WATERING_MAP_KEY, JSON.stringify(map)); } catch {}
}

export async function scheduleWateringReminder(trackingId: string, lastWateredISO: string | undefined, baseIntervalDays: number) {
  // Cancel any existing reminders first
  await cancelWateringReminder(trackingId);
  
  // Get temperature-adjusted interval
  const adjustedIntervalDays = await getTemperatureAdjustedInterval(baseIntervalDays);
  
  // Schedule escalating reminders: first at adjusted interval, second at adjusted + 3 days
  const identifiers: string[] = [];
  
  // First reminder
  const firstReminderDate = computeNextWateringDate(lastWateredISO, adjustedIntervalDays, 9);
  const firstId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Watering reminder',
      body: `Time to water your plants 💧 (${adjustedIntervalDays} day interval)`,
      sound: undefined,
      color: Platform.OS === 'android' ? ANDROID_NOTIFICATION_COLOR : undefined,
    },
    trigger: {
      date: firstReminderDate,
    },
  });
  identifiers.push(firstId);
  
  // Second reminder (escalating) - 3 days after first if still not watered
  const secondReminderDate = new Date(firstReminderDate);
  secondReminderDate.setDate(secondReminderDate.getDate() + 3);
  const secondId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Watering reminder - Urgent!',
      body: 'Your plants are overdue for watering! 💧🚨',
      sound: undefined,
      color: Platform.OS === 'android' ? ANDROID_NOTIFICATION_COLOR : undefined,
    },
    trigger: {
      date: secondReminderDate,
    },
  });
  identifiers.push(secondId);
  
  // Save schedule
  const map = await loadWateringMap();
  map[trackingId] = { 
    trackingId, 
    identifiers, 
    nextISO: firstReminderDate.toISOString(),
    baseIntervalDays,
    adjustedIntervalDays,
    lastWateredISO
  };
  await saveWateringMap(map);
  
  console.log(`Scheduled watering reminders for ${trackingId}: first at ${firstReminderDate.toLocaleDateString()}, second at ${secondReminderDate.toLocaleDateString()}`);
}

export async function cancelWateringReminder(trackingId: string) {
  const map = await loadWateringMap();
  const existing = map[trackingId];
  if (existing?.identifiers) {
    for (const identifier of existing.identifiers) {
      try { await Notifications.cancelScheduledNotificationAsync(identifier); } catch {}
    }
  }
  delete map[trackingId];
  await saveWateringMap(map);
}

export async function rescheduleWateringReminderIfChanged(trackingId: string, lastWateredISO: string | undefined, baseIntervalDays: number) {
  const map = await loadWateringMap();
  const existing = map[trackingId];
  
  // Get current temperature-adjusted interval
  const adjustedIntervalDays = await getTemperatureAdjustedInterval(baseIntervalDays);
  const next = computeNextWateringDate(lastWateredISO, adjustedIntervalDays, 9).toISOString();
  
  // Check if anything changed
  const needsReschedule = !existing || 
    existing.nextISO !== next || 
    existing.baseIntervalDays !== baseIntervalDays ||
    existing.adjustedIntervalDays !== adjustedIntervalDays ||
    existing.lastWateredISO !== lastWateredISO;
  
  if (!needsReschedule) {
    return; // no change
  }
  
  // Cancel old and schedule new
  await cancelWateringReminder(trackingId);
  await scheduleWateringReminder(trackingId, lastWateredISO, baseIntervalDays);
}

// Background weather task
TaskManager.defineTask(WEATHER_TASK, async () => {
  try {
    // Load cached location and unit from GardenContext persistence
    const raw = await AsyncStorage.getItem(LOCATION_KEY);
    if (!raw) return BackgroundFetch.BackgroundFetchResult.NoData;
    const parsed = JSON.parse(raw);
    const location = parsed?.location;
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // No need for token; Open-Meteo
    const bundle = await fetchWeather(location.latitude, location.longitude, true, 'fahrenheit');
    // Decide alerts: freeze <= 32F, frost risk <= 36F
    const today = bundle.daily?.[0];
    if (today) {
      const classification = classifyFrost(today.minF);
      if (classification?.type === 'freeze') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Freeze warning ❄️',
            body: `Overnight low ${classification.rounded}°F. Protect sensitive plants.`,
            color: Platform.OS === 'android' ? ANDROID_NOTIFICATION_COLOR : undefined,
          },
          trigger: null, // immediate
        });
      } else if (classification?.type === 'frost') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Frost risk 🌫️',
            body: `Overnight low ${classification.rounded}°F. Consider covers for tender plants.`,
            color: Platform.OS === 'android' ? ANDROID_NOTIFICATION_COLOR : undefined,
          },
          trigger: null,
        });
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerWeatherBackgroundTask() {
  const isDefined = await TaskManager.isTaskRegisteredAsync(WEATHER_TASK);
  if (!isDefined) {
    try {
      await BackgroundFetch.registerTaskAsync(WEATHER_TASK, {
        minimumInterval: 6 * 60 * 60, // ~6 hours; OS decides exact schedule
        stopOnTerminate: false,
        startOnBoot: true,
      });
    } catch (e) {
      // swallow; some devices may restrict background fetch
    }
  }
}

// Test function to manually trigger frost warning notification
export async function testFrostWarningNotification() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Freeze warning ❄️',
        body: `Overnight low 28°F. Protect sensitive plants.`,
        color: Platform.OS === 'android' ? ANDROID_NOTIFICATION_COLOR : undefined,
      },
      trigger: null, // immediate
    });
    console.log('Test frost warning notification sent!');
  } catch (e) {
    console.error('Failed to send test notification:', e);
  }
}

// Test function to manually trigger frost risk notification
export async function testFrostRiskNotification() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Frost risk 🌫️',
        body: `Overnight low 36°F. Consider covers for tender plants.`,
        color: Platform.OS === 'android' ? ANDROID_NOTIFICATION_COLOR : undefined,
      },
      trigger: null, // immediate
    });
    console.log('Test frost risk notification sent!');
  } catch (e) {
    console.error('Failed to send test notification:', e);
  }
}

// Test function to manually trigger watering reminder notification
export async function testWateringReminder() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Watering reminder',
        body: `Time to water your plants 💧 (4 day interval)`,
        sound: undefined,
        color: Platform.OS === 'android' ? ANDROID_NOTIFICATION_COLOR : undefined,
      },
      trigger: null, // immediate
    });
    console.log('Test watering reminder notification sent!');
  } catch (e) {
    console.error('Failed to send test notification:', e);
  }
}

// Test function to manually trigger urgent watering reminder notification
export async function testUrgentWateringReminder() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Watering reminder - Urgent!',
        body: 'Your plants are overdue for watering! 💧🚨',
        sound: undefined,
        color: Platform.OS === 'android' ? ANDROID_NOTIFICATION_COLOR : undefined,
      },
      trigger: null, // immediate
    });
    console.log('Test urgent watering reminder notification sent!');
  } catch (e) {
    console.error('Failed to send test notification:', e);
  }
}

// Test function to manually trigger overdue plant notification
export async function testOverdueWateringReminder() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Urgent! - Water your plants',
        body: 'Tomato needs watering! 💧 (7 days since last watering)',
        sound: undefined,
        color: Platform.OS === 'android' ? ANDROID_NOTIFICATION_COLOR : undefined,
      },
      trigger: null, // immediate
    });
    console.log('Test overdue watering reminder notification sent!');
  } catch (e) {
    console.error('Failed to send test notification:', e);
  }
}

// Called when a plant is watered - cancels pending reminders
export async function onPlantWatered(trackingId: string) {
  await cancelWateringReminder(trackingId);
  console.log(`Cancelled watering reminders for ${trackingId} after watering`);
}

// Check for overdue plants and send immediate reminders
export async function checkOverdueWateringReminders(trackedPlants: Array<{trackingId: string, lastWatered?: string, wateringIntervalDays?: number, name?: string}>) {
  const now = new Date();
  
  for (const plant of trackedPlants) {
    if (!plant.lastWatered || !plant.wateringIntervalDays) continue;
    
    const lastWatered = new Date(plant.lastWatered);
    const adjustedInterval = await getTemperatureAdjustedInterval(plant.wateringIntervalDays);
    const daysSinceWatered = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
    
    // Send immediate reminder if:
    // 1. Plant hasn't been watered in 4-7 days (escalating reminder period)
    // 2. Or if it's been longer than the adjusted interval + 3 days (very overdue)
    if ((daysSinceWatered >= 4 && daysSinceWatered <= 7) || daysSinceWatered > (adjustedInterval + 3)) {
      try {
        const urgency = daysSinceWatered > adjustedInterval ? 'Urgent!' : 'Reminder';
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${urgency} - Water your plants`,
            body: `${plant.name || 'Plant'} needs watering! 💧 (${daysSinceWatered} days since last watering)`,
            sound: undefined,
            color: Platform.OS === 'android' ? ANDROID_NOTIFICATION_COLOR : undefined,
          },
          trigger: null, // immediate
        });
        console.log(`Sent immediate watering reminder for ${plant.name || plant.trackingId}`);
      } catch (e) {
        console.error('Failed to send immediate watering reminder:', e);
      }
    }
  }
}
