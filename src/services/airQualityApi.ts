import { FALLBACK_SNAPSHOTS, PRESET_CITIES } from '../data/presets';
import { getDominantPollutant } from '../engine/decisionEngine';
import type { AirQualitySnapshot, CityLocation, HourlyForecastPoint } from '../types/airQuality';

const CACHE_PREFIX = 'aeropulse_aqi_cache_v1_';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const REQUEST_TIMEOUT_MS = 6500;

interface CachedEntry {
  timestamp: number;
  data: AirQualitySnapshot;
}

function sanitizeQuery(raw: string): string {
  return raw.replace(/[^\p{L}\p{N}\s,.-]/gu, '').trim().slice(0, 64);
}

async function fetchWithTimeout(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function readCache(cityId: string): AirQualitySnapshot | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${cityId}`);
    if (!raw) return null;
    const parsed: CachedEntry = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(`${CACHE_PREFIX}${cityId}`);
      return null;
    }
    return { ...parsed.data, source: 'cached' };
  } catch {
    return null;
  }
}

function writeCache(cityId: string, data: AirQualitySnapshot): void {
  try {
    const entry: CachedEntry = { timestamp: Date.now(), data };
    localStorage.setItem(`${CACHE_PREFIX}${cityId}`, JSON.stringify(entry));
  } catch {
    // Ignore storage quota errors
  }
}

export async function searchCities(query: string): Promise<CityLocation[]> {
  const clean = sanitizeQuery(query);
  if (clean.length < 2) {
    return PRESET_CITIES;
  }

  const localMatches = PRESET_CITIES.filter((c) =>
    `${c.name} ${c.country}`.toLowerCase().includes(clean.toLowerCase())
  );

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      clean
    )}&count=6&language=en&format=json`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return localMatches;

    const json = (await res.json()) as {
      results?: Array<{
        id: number;
        name: string;
        country?: string;
        admin1?: string;
        latitude: number;
        longitude: number;
      }>;
    };

    if (!json.results || json.results.length === 0) {
      return localMatches;
    }

    return json.results.map((item) => ({
      id: `${item.id}`,
      name: item.name,
      country: item.country ?? 'Unknown',
      admin1: item.admin1,
      latitude: item.latitude,
      longitude: item.longitude,
    }));
  } catch {
    return localMatches;
  }
}

export async function fetchAirQualityForCity(city: CityLocation): Promise<AirQualitySnapshot> {
  const cached = readCache(city.id);
  if (cached) {
    return cached;
  }

  try {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${city.latitude.toFixed(4)}&longitude=${city.longitude.toFixed(4)}` +
      `&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone` +
      `&hourly=us_aqi,pm2_5,ozone&forecast_days=2&timezone=auto`;

    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const json = (await res.json()) as {
      current?: {
        us_aqi?: number;
        pm2_5?: number;
        pm10?: number;
        ozone?: number;
        nitrogen_dioxide?: number;
        sulphur_dioxide?: number;
        carbon_monoxide?: number;
        time?: string;
      };
      hourly?: {
        time?: string[];
        us_aqi?: Array<number | null>;
        pm2_5?: Array<number | null>;
        ozone?: Array<number | null>;
      };
    };

    if (!json.current) {
      throw new Error('Missing current air quality data');
    }

    const pollutants = {
      pm25: Number((json.current.pm2_5 ?? 12).toFixed(1)),
      pm10: Number((json.current.pm10 ?? 20).toFixed(1)),
      o3: Number((json.current.ozone ?? 50).toFixed(1)),
      no2: Number((json.current.nitrogen_dioxide ?? 18).toFixed(1)),
      so2: Number((json.current.sulphur_dioxide ?? 4).toFixed(1)),
      co: Number((json.current.carbon_monoxide ?? 300).toFixed(0)),
    };

    const hourlyForecast: HourlyForecastPoint[] = [];
    const times = json.hourly?.time ?? [];
    const aqis = json.hourly?.us_aqi ?? [];
    const pm25s = json.hourly?.pm2_5 ?? [];
    const o3s = json.hourly?.ozone ?? [];

    const nowMs = Date.now() - 3600 * 1000;
    for (let i = 0; i < times.length && hourlyForecast.length < 24; i++) {
      const tMs = new Date(times[i]).getTime();
      if (tMs >= nowMs && aqis[i] != null) {
        hourlyForecast.push({
          time: times[i],
          aqi: Math.round(aqis[i] ?? 0),
          pm25: Number((pm25s[i] ?? pollutants.pm25).toFixed(1)),
          o3: Number((o3s[i] ?? pollutants.o3).toFixed(1)),
        });
      }
    }

    const snapshot: AirQualitySnapshot = {
      city,
      aqi: Math.round(json.current.us_aqi ?? 45),
      pollutants,
      dominantPollutant: getDominantPollutant(pollutants),
      hourlyForecast,
      updatedAt: json.current.time ?? new Date().toISOString(),
      source: 'live',
    };

    writeCache(city.id, snapshot);
    return snapshot;
  } catch {
    if (FALLBACK_SNAPSHOTS[city.id]) {
      return {
        ...FALLBACK_SNAPSHOTS[city.id],
        updatedAt: new Date().toISOString(),
      };
    }
    // Generic fallback for searched cities when offline
    const base = FALLBACK_SNAPSHOTS['london'];
    return {
      ...base,
      city,
      updatedAt: new Date().toISOString(),
      source: 'offline-fallback',
    };
  }
}
