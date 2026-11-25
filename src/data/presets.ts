import type { AirQualitySnapshot, CityLocation, HourlyForecastPoint } from '../types/airQuality';

function buildSampleForecast(baseAqi: number, basePm25: number, baseO3: number): HourlyForecastPoint[] {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const points: HourlyForecastPoint[] = [];

  for (let i = 0; i < 24; i++) {
    const dt = new Date(now.getTime() + i * 3600 * 1000);
    const hour = dt.getHours();
    // Diurnal urban pollution curve: lower 2am-6am, peaks 8am-10am & 6pm-9pm
    let factor = 1.0;
    if (hour >= 1 && hour <= 5) factor = 0.72;
    else if (hour >= 8 && hour <= 10) factor = 1.18;
    else if (hour >= 13 && hour <= 16) factor = 0.94;
    else if (hour >= 18 && hour <= 21) factor = 1.22;

    const wave = Math.sin((i / 24) * Math.PI * 2) * 0.06;
    const multiplier = Math.max(0.55, factor + wave);

    points.push({
      time: dt.toISOString(),
      aqi: Math.max(8, Math.round(baseAqi * multiplier)),
      pm25: Number((basePm25 * multiplier).toFixed(1)),
      o3: Number((baseO3 * (hour >= 12 && hour <= 17 ? 1.25 : 0.9)).toFixed(1)),
    });
  }
  return points;
}

export const PRESET_CITIES: CityLocation[] = [
  {
    id: 'san-francisco',
    name: 'San Francisco',
    country: 'United States',
    admin1: 'California',
    latitude: 37.7749,
    longitude: -122.4194,
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    admin1: 'England',
    latitude: 51.5074,
    longitude: -0.1278,
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    admin1: 'Tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
  },
  {
    id: 'new-delhi',
    name: 'New Delhi',
    country: 'India',
    admin1: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
  },
  {
    id: 'sao-paulo',
    name: 'São Paulo',
    country: 'Brazil',
    admin1: 'São Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
  },
  {
    id: 'beijing',
    name: 'Beijing',
    country: 'China',
    admin1: 'Beijing',
    latitude: 39.9042,
    longitude: 116.4074,
  },
];

export const FALLBACK_SNAPSHOTS: Record<string, AirQualitySnapshot> = {
  'san-francisco': {
    city: PRESET_CITIES[0],
    aqi: 34,
    pollutants: { pm25: 8.2, pm10: 15.4, o3: 58.0, no2: 14.2, so2: 2.1, co: 240 },
    dominantPollutant: 'o3',
    hourlyForecast: buildSampleForecast(34, 8.2, 58),
    updatedAt: new Date().toISOString(),
    source: 'offline-fallback',
  },
  london: {
    city: PRESET_CITIES[1],
    aqi: 52,
    pollutants: { pm25: 12.6, pm10: 21.8, o3: 64.0, no2: 31.5, so2: 4.8, co: 310 },
    dominantPollutant: 'pm25',
    hourlyForecast: buildSampleForecast(52, 12.6, 64),
    updatedAt: new Date().toISOString(),
    source: 'offline-fallback',
  },
  tokyo: {
    city: PRESET_CITIES[2],
    aqi: 44,
    pollutants: { pm25: 10.4, pm10: 18.2, o3: 62.5, no2: 24.0, so2: 3.4, co: 275 },
    dominantPollutant: 'pm25',
    hourlyForecast: buildSampleForecast(44, 10.4, 62.5),
    updatedAt: new Date().toISOString(),
    source: 'offline-fallback',
  },
  'new-delhi': {
    city: PRESET_CITIES[3],
    aqi: 178,
    pollutants: { pm25: 106.4, pm10: 168.0, o3: 74.0, no2: 52.3, so2: 14.8, co: 1180 },
    dominantPollutant: 'pm25',
    hourlyForecast: buildSampleForecast(178, 106.4, 74),
    updatedAt: new Date().toISOString(),
    source: 'offline-fallback',
  },
  'sao-paulo': {
    city: PRESET_CITIES[4],
    aqi: 68,
    pollutants: { pm25: 19.8, pm10: 34.5, o3: 78.0, no2: 36.1, so2: 5.5, co: 420 },
    dominantPollutant: 'pm25',
    hourlyForecast: buildSampleForecast(68, 19.8, 78),
    updatedAt: new Date().toISOString(),
    source: 'offline-fallback',
  },
  beijing: {
    city: PRESET_CITIES[5],
    aqi: 118,
    pollutants: { pm25: 42.5, pm10: 78.2, o3: 82.0, no2: 41.0, so2: 9.2, co: 760 },
    dominantPollutant: 'pm25',
    hourlyForecast: buildSampleForecast(118, 42.5, 82),
    updatedAt: new Date().toISOString(),
    source: 'offline-fallback',
  },
};
