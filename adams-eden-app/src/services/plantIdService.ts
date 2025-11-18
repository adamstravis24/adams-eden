// Plant.id API v3 service wrapper
import { optionalEnv } from '../utils/env';

export type PlantIdSuggestion = {
  id?: string | number;
  name: string; // scientific name
  probability: number; // 0..1
  common_names?: string[];
  wiki_url?: string;
  wiki_description?: { value?: string; citation?: string; license_name?: string };
  synonyms?: string[];
  sunlight?: string[]; // e.g., ["full sun", "partial shade"]
  toxicity?: any; // shape may vary; handle defensively in UI
  taxonomy?: Record<string, string>;
  similar_images?: Array<{
    id?: string | number;
    url: string;
    license_name?: string;
    citation?: string;
  }>;
};

export type PlantIdResponse = {
  id?: string | number;
  suggestions: PlantIdSuggestion[];
  is_plant?: boolean;
  is_plant_probability?: number;
};

const API_URL = 'https://api.plant.id/v3/identification';

let loggedKeyStatus = false;

function getApiKey(): string | undefined {
  const raw =
    optionalEnv('PLANT_ID_API_KEY') ??
    optionalEnv('EXPO_PUBLIC_PLANT_ID_API_KEY') ??
    undefined;

  if (__DEV__ && !loggedKeyStatus) {
    if (raw) {
      console.log('[plantId] Using API key', `${raw.trim().slice(0, 4)}…${raw.trim().slice(-4)}`);
    } else {
      console.warn('[plantId] API key missing (PLANT_ID_API_KEY or EXPO_PUBLIC_PLANT_ID_API_KEY)');
    }
    loggedKeyStatus = true;
  }

  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : undefined;
}

export function getPlantIdApiKeyInfo(): { present: boolean; preview?: string } {
  const key = getApiKey();
  if (!key) return { present: false };
  const tail = key.slice(-4);
  return { present: true, preview: `****${tail}` };
}

// v3 accepts raw base64 strings (no data URL prefix)
function sanitizeBase64(input: string): string {
  if (!input) return input;
  const commaIdx = input.indexOf(',');
  if (input.startsWith('data:image') && commaIdx > -1) {
    return input.slice(commaIdx + 1);
  }
  return input;
}

export async function identifyPlantFromBase64(imagesBase64: string[], options?: {
  latitude?: number | null;
  longitude?: number | null;
  language?: string;
  similarImages?: boolean;
}): Promise<PlantIdResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'Missing Plant.id API key. Define EXPO_PUBLIC_PLANT_ID_API_KEY or PLANT_ID_API_KEY in your environment.'
    );
  }

  // Build query params per v3 examples (details as comma-separated list)
  const params = new URLSearchParams();
  const details = ['url', 'common_names', 'wiki_url', 'wiki_description', 'taxonomy', 'synonyms', 'sunlight', 'toxicity'];
  params.set('details', details.join(','));
  if (options?.language) params.set('language', options.language);
  if (options?.similarImages !== false) params.set('similar_images', 'true');

  if (typeof options?.latitude === 'number' && typeof options?.longitude === 'number') {
    params.set('lat', String(options.latitude));
    params.set('lng', String(options.longitude));
  }

  const url = `${API_URL}?${params.toString()}`;
  const apiKeyHeader = apiKey as string;
  const body = {
    images: imagesBase64.map(sanitizeBase64),
  } as any;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': apiKeyHeader,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Plant.id request failed: ${res.status} ${res.statusText} ${text}`.trim());
  }
  const data = await res.json();

  // Normalize to a minimal response shape
  // v3 response shape: result.classification.suggestions, result.is_plant
  const root = data?.result || {};
  const cls = root?.classification || {};
  const rawSuggestions = Array.isArray(cls?.suggestions) ? cls.suggestions : [];
  const suggestions: PlantIdSuggestion[] = rawSuggestions.map((s: any) => ({
    id: s?.id,
    name: s?.name || '',
    probability: typeof s?.probability === 'number' ? s.probability : 0,
    common_names: s?.details?.common_names || [],
    wiki_url: s?.details?.wiki_url || s?.details?.url,
    wiki_description: s?.details?.wiki_description,
    synonyms: s?.details?.synonyms,
    sunlight: Array.isArray(s?.details?.sunlight) ? s.details.sunlight : undefined,
    toxicity: s?.details?.toxicity,
    taxonomy: s?.details?.taxonomy,
    similar_images: s?.similar_images,
  }));

  return {
    id: data?.id,
    suggestions,
    is_plant: !!root?.is_plant?.binary,
    is_plant_probability: typeof root?.is_plant?.probability === 'number' ? root.is_plant.probability : undefined,
  };
}
