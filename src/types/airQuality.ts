export type UserPersona =
  | 'general'
  | 'athlete'
  | 'asthma_respiratory'
  | 'child_elderly'
  | 'commuter';

export type ActivityType =
  | 'rest'
  | 'light_walk'
  | 'moderate_exercise'
  | 'vigorous_workout'
  | 'commute';

export type DurationOption = 15 | 30 | 60 | 120;

export type EnvironmentType = 'outdoor' | 'indoor_unfiltered' | 'indoor_filtered';

export interface UserContext {
  persona: UserPersona;
  activity: ActivityType;
  durationMinutes: DurationOption;
  environment: EnvironmentType;
}

export interface PollutantMetrics {
  pm25: number; // µg/m³
  pm10: number; // µg/m³
  o3: number;   // µg/m³
  no2: number;  // µg/m³
  so2: number;  // µg/m³
  co: number;   // µg/m³
}

export interface HourlyForecastPoint {
  time: string; // ISO string
  aqi: number;
  pm25: number;
  o3: number;
}

export interface CityLocation {
  id: string;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface AirQualitySnapshot {
  city: CityLocation;
  aqi: number; // US AQI (0-500)
  pollutants: PollutantMetrics;
  dominantPollutant: keyof PollutantMetrics;
  hourlyForecast: HourlyForecastPoint[];
  updatedAt: string;
  source: 'live' | 'cached' | 'offline-fallback';
}

export type AqiCategoryKey =
  | 'good'
  | 'moderate'
  | 'sensitive'
  | 'unhealthy'
  | 'very_unhealthy'
  | 'hazardous';

export interface AqiCategory {
  key: AqiCategoryKey;
  label: string;
  range: string;
  colorVar: string;
  badgeBg: string;
  description: string;
}

export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'critical';

export interface OptimalWindow {
  startTime: string;
  endTime: string;
  avgAqi: number;
  improvementPercent: number;
  isCurrentBest: boolean;
}

export interface AssistantRecommendation {
  id: string;
  category: 'activity' | 'protection' | 'ventilation' | 'health';
  title: string;
  detail: string;
  priority: 'info' | 'caution' | 'warning';
}

export interface DecisionResult {
  category: AqiCategory;
  personalizedRiskScore: number; // 0-100
  riskLevel: RiskLevel;
  verdictTitle: string;
  verdictSummary: string;
  maskAdvice: string;
  ventilationAdvice: string;
  optimalWindow: OptimalWindow | null;
  recommendations: AssistantRecommendation[];
  pollutantAlerts: string[];
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}
