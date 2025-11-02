const BASE_URL = (process.env.EXPO_PUBLIC_PERENUAL_PROXY_URL as string | undefined) || 'https://perenual.com/api';

export type PerenualSpeciesListItem = {
  id: number;
  common_name?: string;
  scientific_name?: string[];
  other_name?: string[] | string;
  family?: string;
  genus?: string;
  default_image?: {
    thumbnail?: string;
    small_url?: string;
    medium_url?: string;
    regular_url?: string;
    original_url?: string;
  };
};

export type PerenualPaginationMeta = {
  to: number;
  from: number;
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
};

export type PerenualSpeciesListResponse = {
  data: PerenualSpeciesListItem[];
  meta: PerenualPaginationMeta;
};

export type ListSpeciesParams = {
  q?: string;
  page?: number;
  order?: 'asc' | 'desc';
  edible?: boolean;
  indoor?: boolean;
  poisonous?: boolean;
  cycle?: 'annual' | 'biennial' | 'biannual' | 'perennial';
  watering?: 'none' | 'minimum' | 'average' | 'frequent';
  sunlight?: 'full_shade' | 'part_shade' | 'sun-part_shade' | 'full_sun';
  hardiness?: string; // e.g., "4-8"
};

function getApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_PERENUAL_API_KEY as string | undefined;
}

function isKeyPlausible(key?: string): boolean {
  if (!key) return false;
  // Perenual keys are typically at least ~24 chars; avoid overfitting the format
  return typeof key === 'string' && key.trim().length >= 16;
}

function makeUrl(path: string, params: Record<string, any> = {}): string {
  const base = BASE_URL.replace(/\/+$/, '');
  const p = String(path).replace(/^\/+/, '');
  const url = new URL(`${base}/${p}`);
  const key = getApiKey();
  if (key) url.searchParams.set('key', key);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    url.searchParams.set(k, String(v));
  });
  return url.toString();
}

// ---- Rate limit & cooldown handling ----
type RateLimitState = { coolingDown: boolean; until?: number };
let rateLimitedUntil: number | undefined;
let consecutive429 = 0;
const rlSubscribers = new Set<(s: RateLimitState) => void>();

function notifyRL() {
  const state: RateLimitState = { coolingDown: !!rateLimitedUntil, until: rateLimitedUntil };
  rlSubscribers.forEach((cb) => {
    try { cb(state); } catch {}
  });
}

function setCooldown(ms: number) {
  const now = Date.now();
  const until = now + Math.max(0, ms);
  if (!rateLimitedUntil || until > rateLimitedUntil) {
    rateLimitedUntil = until;
    notifyRL();
    // Clear when done
    const delay = until - now;
    setTimeout(() => {
      if (rateLimitedUntil && Date.now() >= rateLimitedUntil) {
        rateLimitedUntil = undefined;
        notifyRL();
      }
    }, Math.min(delay + 50, 60000));
  }
}

function retryAfterToMs(v: string | null): number | undefined {
  if (!v) return undefined;
  // Could be seconds or HTTP-date
  const seconds = Number(v);
  if (!Number.isNaN(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(v);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return undefined;
}

async function waitForCooldown(signal?: AbortSignal) {
  while (rateLimitedUntil && Date.now() < rateLimitedUntil) {
    const ms = Math.max(0, rateLimitedUntil - Date.now());
    await new Promise<void>((resolve, reject) => {
      const tid = setTimeout(() => resolve(), Math.min(ms, 1000));
      if (signal) {
        const onAbort = () => {
          clearTimeout(tid);
          signal.removeEventListener('abort', onAbort);
          const err: any = new Error('Aborted');
          err.name = 'AbortError';
          reject(err);
        };
        signal.addEventListener('abort', onAbort);
      }
    });
    if (signal?.aborted) { const err: any = new Error('Aborted'); err.name = 'AbortError'; throw err; }
  }
}

export function getRateLimitState(): RateLimitState {
  return { coolingDown: !!rateLimitedUntil, until: rateLimitedUntil };
}

export function subscribeRateLimit(cb: (s: RateLimitState) => void): () => void {
  rlSubscribers.add(cb);
  // Push current immediately
  try { cb(getRateLimitState()); } catch {}
  return () => { rlSubscribers.delete(cb); };
}

type HttpOptions = { signal?: AbortSignal };

async function http<T>(url: string, opts: HttpOptions = {}): Promise<T> {
  // If cooling down, wait before issuing the request
  await waitForCooldown(opts.signal);
  console.log(`[Perenual] Making request to: ${new URL(url).pathname}`);
  let res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'AdamsEden/1.0 (+https://example.com)'
    },
    signal: opts.signal,
  });
  let contentType = res.headers?.get?.('content-type') || '';
  let text = await res.text();
  // Handle 429 specially: set cooldown and retry once after waiting
  if (res.status === 429) {
    consecutive429++;
    const ra = retryAfterToMs(res.headers?.get?.('retry-after'));
    const backoff = ra ?? Math.min(1500 * Math.pow(2, Math.min(consecutive429 - 1, 4)), 15000);
    // Add small jitter 0-300ms
    const jitter = Math.floor(Math.random() * 300);
    console.log(`[Perenual] 429 Rate Limited. Retry-After: ${res.headers?.get?.('retry-after')} | Backoff: ${backoff}ms | Consecutive: ${consecutive429}`);
    setCooldown(backoff + jitter);
    // If body is not JSON, we don't really care; we will retry
    await waitForCooldown(opts.signal);
    // Retry once
    const res2 = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'AdamsEden/1.0 (+https://example.com)'
      },
      signal: opts.signal,
    });
    const contentType2 = res2.headers?.get?.('content-type') || '';
    const text2 = await res2.text();
    if (res2.status === 429) {
      // Extend cooldown and fail
      consecutive429++;
      const ra2 = retryAfterToMs(res2.headers?.get?.('retry-after'));
      const backoff2 = ra2 ?? Math.min(1500 * Math.pow(2, Math.min(consecutive429 - 1, 4)), 20000);
      console.log(`[Perenual] 429 AGAIN after retry. Retry-After: ${res2.headers?.get?.('retry-after')} | Backoff: ${backoff2}ms | Consecutive: ${consecutive429}`);
      setCooldown(backoff2 + Math.floor(Math.random() * 300));
      throw new Error('Rate limited by Perenual API. Your API key may have reached its daily/hourly limit. Please wait or upgrade your plan.');
    }
    // Success or other error path continues by reassigning into res/text/contentType
    consecutive429 = 0;
    // Rebind vars for unified code path below
  res = res2;
  contentType = contentType2;
  text = text2;
  } else if (res.ok) {
    // Reset streak on success codes
    consecutive429 = 0;
  }
  let data: any;
  if (/application\/json/i.test(contentType)) {
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      throw new Error('Perenual API returned invalid JSON');
    }
  } else {
    // Non-JSON content, likely HTML (CORS/proxy/CF). Provide diagnostic snippet.
    const snippet = text ? String(text).slice(0, 140).replace(/\s+/g, ' ').trim() : '';
    const urlObj = new URL(url);
    urlObj.searchParams.delete('key');
    throw new Error(`Non-JSON response (${contentType || 'unknown'}). Path: ${urlObj.pathname}${urlObj.search} Snippet: ${snippet}`);
  }
  if (!res.ok) {
    const msg = typeof data === 'string' ? data : (data?.message || res.statusText);
    throw new Error(`Perenual API error ${res.status}: ${msg}`);
  }
  // Some Perenual endpoints may return HTTP 200 with an error payload
  if (data && typeof data === 'object') {
    if (typeof (data as any).error === 'string') {
      throw new Error((data as any).error);
    }
    if ((data as any).success === false) {
      const msg = (data as any).message || 'Perenual API returned success:false';
      throw new Error(msg);
    }
  }
  return data as T;
}

export async function listSpecies(params: ListSpeciesParams = {}, opts: HttpOptions = {}): Promise<PerenualSpeciesListResponse> {
  const key = getApiKey();
  if (!isKeyPlausible(key)) {
    throw new Error('Perenual API key missing or invalid. Set EXPO_PUBLIC_PERENUAL_API_KEY and restart.');
  }
  const url = makeUrl('/species-list', {
    q: params.q,
    page: params.page ?? 1,
    order: params.order,
    edible: params.edible,
    indoor: params.indoor,
    poisonous: params.poisonous,
    cycle: params.cycle,
    watering: params.watering,
    sunlight: params.sunlight,
    hardiness: params.hardiness,
  });
  const payload = await http<PerenualSpeciesListResponse | any>(url, opts);
  // Validate expected shape
  if (!payload || !Array.isArray((payload as any).data)) {
    const hint = typeof (payload as any)?.message === 'string' ? `: ${(payload as any).message}` : '';
    throw new Error(`Unexpected response from Perenual species-list${hint}`);
  }
  return payload as PerenualSpeciesListResponse;
}

export type PerenualSpeciesDetail = PerenualSpeciesListItem & {
  origin?: string[];
  type?: string;
  sunlight?: string[];
  watering?: string;
  hardiness?: { min?: string; max?: string };
  description?: string;
  cycle?: string;
  care_level?: string;
  indoor?: boolean;
  maintenance?: string;
  soil?: string[];
  propagation?: string[];
  growth_rate?: string;
  height?: string | { cm?: string | number; m?: string | number; in?: string | number; ft?: string | number };
  width?: string | { cm?: string | number; m?: string | number; in?: string | number; ft?: string | number };
  flowering_season?: string | string[];
  flowering?: boolean;
  invasive?: boolean;
  edible_part?: string[] | string;
  medicinal?: boolean;
  poisonous?: boolean | string;
  drought_tolerant?: boolean;
  attracts?: string[];
  pruning_month?: string[];
  watering_period?: string;
  watering_general_benchmark?: string | Record<string, any>;
  [key: string]: any; // Allow additional fields from API without type errors
};

export async function getSpeciesDetails(id: number, opts: HttpOptions = {}): Promise<PerenualSpeciesDetail> {
  const key = getApiKey();
  if (!isKeyPlausible(key)) {
    throw new Error('Perenual API key missing or invalid. Set EXPO_PUBLIC_PERENUAL_API_KEY and restart.');
  }
  const url = makeUrl(`/species/details/${id}`);
  return await http<PerenualSpeciesDetail>(url, opts);
}

export function isPerenualConfigured(): boolean {
  return isKeyPlausible(getApiKey());
}
