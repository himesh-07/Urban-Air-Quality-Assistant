import type {
  ActivityType,
  AirQualitySnapshot,
  AqiCategory,
  AssistantRecommendation,
  DecisionResult,
  DurationOption,
  EnvironmentType,
  HourlyForecastPoint,
  OptimalWindow,
  PollutantMetrics,
  RiskLevel,
  UserContext,
  UserPersona,
} from '../types/airQuality';

export const PERSONA_META: Record<
  UserPersona,
  { label: string; sensitivityMultiplier: number; description: string }
> = {
  general: {
    label: 'General Adult',
    sensitivityMultiplier: 1.0,
    description: 'Standard baseline respiratory sensitivity',
  },
  athlete: {
    label: 'Outdoor Athlete',
    sensitivityMultiplier: 1.25,
    description: 'Higher minute ventilation increases pollutant intake',
  },
  asthma_respiratory: {
    label: 'Asthma / Respiratory',
    sensitivityMultiplier: 1.55,
    description: 'Elevated airway sensitivity to PM2.5, O₃, and NO₂',
  },
  child_elderly: {
    label: 'Child / Elderly',
    sensitivityMultiplier: 1.4,
    description: 'Developing or vulnerable cardiopulmonary capacity',
  },
  commuter: {
    label: 'Daily Commuter',
    sensitivityMultiplier: 1.15,
    description: 'Exposed to roadside NO₂ and traffic particulates',
  },
};

export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; intensityMultiplier: number }
> = {
  rest: { label: 'Resting / Low Effort', intensityMultiplier: 0.75 },
  light_walk: { label: 'Light Walk / Errands', intensityMultiplier: 1.0 },
  commute: { label: 'Cycling / Transit Commute', intensityMultiplier: 1.2 },
  moderate_exercise: { label: 'Moderate Exercise / Jog', intensityMultiplier: 1.35 },
  vigorous_workout: { label: 'Vigorous Workout / Run', intensityMultiplier: 1.6 },
};

export const ENVIRONMENT_META: Record<
  EnvironmentType,
  { label: string; exposureFactor: number }
> = {
  outdoor: { label: 'Outdoors', exposureFactor: 1.0 },
  indoor_unfiltered: { label: 'Indoors (Natural Ventilation)', exposureFactor: 0.68 },
  indoor_filtered: { label: 'Indoors (HEPA / AC Filtered)', exposureFactor: 0.28 },
};

export function classifyAqi(aqi: number): AqiCategory {
  if (aqi <= 50) {
    return {
      key: 'good',
      label: 'Good',
      range: '0–50',
      colorVar: 'var(--aqi-good)',
      badgeBg: 'var(--aqi-good-bg)',
      description: 'Air quality is satisfactory with little or no risk.',
    };
  }
  if (aqi <= 100) {
    return {
      key: 'moderate',
      label: 'Moderate',
      range: '51–100',
      colorVar: 'var(--aqi-moderate)',
      badgeBg: 'var(--aqi-moderate-bg)',
      description: 'Acceptable air quality; unusually sensitive people may experience mild symptoms.',
    };
  }
  if (aqi <= 150) {
    return {
      key: 'sensitive',
      label: 'Unhealthy for Sensitive Groups',
      range: '101–150',
      colorVar: 'var(--aqi-sensitive)',
      badgeBg: 'var(--aqi-sensitive-bg)',
      description: 'Sensitive groups may experience health effects; general public less likely.',
    };
  }
  if (aqi <= 200) {
    return {
      key: 'unhealthy',
      label: 'Unhealthy',
      range: '151–200',
      colorVar: 'var(--aqi-unhealthy)',
      badgeBg: 'var(--aqi-unhealthy-bg)',
      description: 'Everyone may begin to experience health effects; sensitive groups face serious risk.',
    };
  }
  if (aqi <= 300) {
    return {
      key: 'very_unhealthy',
      label: 'Very Unhealthy',
      range: '201–300',
      colorVar: 'var(--aqi-very-unhealthy)',
      badgeBg: 'var(--aqi-very-unhealthy-bg)',
      description: 'Health alert: everyone is more likely to be affected.',
    };
  }
  return {
    key: 'hazardous',
    label: 'Hazardous',
    range: '301+',
    colorVar: 'var(--aqi-hazardous)',
    badgeBg: 'var(--aqi-hazardous-bg)',
    description: 'Health warning of emergency conditions. Avoid all outdoor exertion.',
  };
}

export function getDominantPollutant(pollutants: PollutantMetrics): keyof PollutantMetrics {
  // Normalize against WHO / EPA reference thresholds to identify the primary driver
  const ratios: Record<keyof PollutantMetrics, number> = {
    pm25: pollutants.pm25 / 15,
    pm10: pollutants.pm10 / 45,
    o3: pollutants.o3 / 100,
    no2: pollutants.no2 / 25,
    so2: pollutants.so2 / 40,
    co: pollutants.co / 4000,
  };

  let dominant: keyof PollutantMetrics = 'pm25';
  let maxRatio = -1;
  (Object.keys(ratios) as Array<keyof PollutantMetrics>).forEach((key) => {
    if (ratios[key] > maxRatio) {
      maxRatio = ratios[key];
      dominant = key;
    }
  });
  return dominant;
}

export function computePersonalizedRiskScore(aqi: number, context: UserContext): number {
  const personaFactor = PERSONA_META[context.persona].sensitivityMultiplier;
  const activityFactor = ACTIVITY_META[context.activity].intensityMultiplier;
  const envFactor = ENVIRONMENT_META[context.environment].exposureFactor;
  const durationFactor = getDurationFactor(context.durationMinutes);

  // Base score maps AQI 0-300+ smoothly onto 0-100 scale before context multipliers
  const baseScore = Math.min(100, (aqi / 220) * 75);
  const adjusted = baseScore * personaFactor * activityFactor * envFactor * durationFactor;
  return Math.max(2, Math.min(100, Math.round(adjusted)));
}

function getDurationFactor(duration: DurationOption): number {
  switch (duration) {
    case 15:
      return 0.8;
    case 30:
      return 0.95;
    case 60:
      return 1.1;
    case 120:
      return 1.28;
  }
}

function mapRiskLevel(score: number): RiskLevel {
  if (score < 22) return 'low';
  if (score < 42) return 'moderate';
  if (score < 64) return 'elevated';
  if (score < 84) return 'high';
  return 'critical';
}

export function findOptimalWindow(
  forecast: HourlyForecastPoint[],
  currentAqi: number,
  durationMinutes: DurationOption
): OptimalWindow | null {
  if (!forecast || forecast.length < 3) return null;

  const spanHours = durationMinutes >= 120 ? 2 : 1;
  let bestAvg = Infinity;
  let bestStartIdx = 0;

  for (let i = 0; i <= forecast.length - spanHours; i++) {
    let sum = 0;
    for (let j = 0; j < spanHours; j++) {
      sum += forecast[i + j].aqi;
    }
    const avg = sum / spanHours;
    if (avg < bestAvg) {
      bestAvg = avg;
      bestStartIdx = i;
    }
  }

  const startPoint = forecast[bestStartIdx];
  const endDate = new Date(new Date(startPoint.time).getTime() + spanHours * 3600 * 1000);
  const roundedAvg = Math.round(bestAvg);
  const improvement =
    currentAqi > 0 ? Math.max(0, Math.round(((currentAqi - roundedAvg) / currentAqi) * 100)) : 0;

  return {
    startTime: startPoint.time,
    endTime: endDate.toISOString(),
    avgAqi: roundedAvg,
    improvementPercent: improvement,
    isCurrentBest: bestStartIdx <= 1 || improvement < 5,
  };
}

function buildPollutantAlerts(pollutants: PollutantMetrics): string[] {
  const alerts: string[] = [];
  if (pollutants.pm25 > 35.4) {
    alerts.push(`Elevated fine particulates (PM2.5: ${pollutants.pm25.toFixed(1)} µg/m³) — penetrates deep into lungs.`);
  }
  if (pollutants.o3 > 100) {
    alerts.push(`High ground-level ozone (O₃: ${pollutants.o3.toFixed(0)} µg/m³) — peaks in afternoon sunlight.`);
  }
  if (pollutants.no2 > 40) {
    alerts.push(`High nitrogen dioxide (NO₂: ${pollutants.no2.toFixed(1)} µg/m³) — avoid heavy traffic corridors.`);
  }
  if (pollutants.pm10 > 100) {
    alerts.push(`Coarse dust/PM10 elevated (${pollutants.pm10.toFixed(1)} µg/m³) — eye & throat irritation possible.`);
  }
  return alerts;
}

export function evaluateAirQualityDecision(
  snapshot: AirQualitySnapshot,
  context: UserContext
): DecisionResult {
  const category = classifyAqi(snapshot.aqi);
  const riskScore = computePersonalizedRiskScore(snapshot.aqi, context);
  const riskLevel = mapRiskLevel(riskScore);
  const optimalWindow = findOptimalWindow(
    snapshot.hourlyForecast,
    snapshot.aqi,
    context.durationMinutes
  );
  const pollutantAlerts = buildPollutantAlerts(snapshot.pollutants);

  const isSensitive =
    context.persona === 'asthma_respiratory' || context.persona === 'child_elderly';
  const isHighExertion =
    context.activity === 'moderate_exercise' || context.activity === 'vigorous_workout';

  let verdictTitle = 'Safe to Proceed';
  let verdictSummary = `Conditions in ${snapshot.city.name} are favorable for your ${ACTIVITY_META[context.activity].label.toLowerCase()}.`;

  if (riskLevel === 'moderate') {
    verdictTitle = 'Proceed with Awareness';
    verdictSummary = isSensitive
      ? 'Air quality is moderate, but your sensitivity profile warrants pacing and symptom monitoring.'
      : 'Generally acceptable conditions; keep an eye on peak traffic or afternoon ozone buildup.';
  } else if (riskLevel === 'elevated') {
    verdictTitle = 'Modify Intensity or Timing';
    verdictSummary = isHighExertion
      ? 'High breathing rate amplifies pollutant intake right now. Consider shortening duration or shifting to a cleaner window.'
      : 'Elevated exposure risk for your profile. Limit prolonged outdoor exertion.';
  } else if (riskLevel === 'high') {
    verdictTitle = 'Move Indoors Recommended';
    verdictSummary =
      'Current air quality poses a clear respiratory burden for your planned activity. Switch to indoor filtered space if possible.';
  } else if (riskLevel === 'critical') {
    verdictTitle = 'Avoid Outdoor Exposure';
    verdictSummary =
      'Critical exposure risk. Stay indoors with purified air, keep windows sealed, and defer strenuous activity.';
  }

  let maskAdvice = 'No mask needed for routine outdoor activity.';
  if (snapshot.aqi > 150 || (snapshot.aqi > 100 && isSensitive)) {
    maskAdvice = 'Wear a well-fitted N95, KN95, or FFP2 respirator outdoors.';
  } else if (snapshot.aqi > 100 || (snapshot.aqi > 75 && context.persona === 'commuter')) {
    maskAdvice = 'Consider an N95/KF94 mask along busy roads or during extended outdoor stays.';
  }

  let ventilationAdvice = 'Safe to open windows for natural cross-ventilation.';
  if (snapshot.aqi > 120) {
    ventilationAdvice = 'Keep windows closed; run HEPA air purifier on medium-high.';
  } else if (snapshot.aqi > 75) {
    ventilationAdvice = 'Limit window opening during rush hours; use recirculation mode if available.';
  }

  const recommendations: AssistantRecommendation[] = [
    {
      id: 'activity-plan',
      category: 'activity',
      title: 'Activity Guidance',
      detail:
        riskLevel === 'low' || riskLevel === 'moderate'
          ? `Your ${context.durationMinutes}-min ${ACTIVITY_META[context.activity].label.toLowerCase()} is suitable ${ENVIRONMENT_META[context.environment].label.toLowerCase()}.`
          : `Reduce outdoor intensity or move your ${context.durationMinutes}-min session to an indoor filtered space.`,
      priority: riskLevel === 'low' ? 'info' : riskLevel === 'moderate' ? 'caution' : 'warning',
    },
    {
      id: 'mask-guidance',
      category: 'protection',
      title: 'Respiratory Protection',
      detail: maskAdvice,
      priority: snapshot.aqi > 150 ? 'warning' : snapshot.aqi > 100 ? 'caution' : 'info',
    },
    {
      id: 'ventilation-guidance',
      category: 'ventilation',
      title: 'Indoor Air & Ventilation',
      detail: ventilationAdvice,
      priority: snapshot.aqi > 120 ? 'warning' : snapshot.aqi > 75 ? 'caution' : 'info',
    },
  ];

  if (isSensitive && snapshot.aqi > 50) {
    recommendations.push({
      id: 'health-precaution',
      category: 'health',
      title: 'Sensitivity Precaution',
      detail:
        context.persona === 'asthma_respiratory'
          ? 'Keep rescue inhaler accessible and pause immediately if coughing or wheezing occurs.'
          : 'Schedule frequent breaks and watch for fatigue, throat irritation, or shortness of breath.',
      priority: snapshot.aqi > 100 ? 'warning' : 'caution',
    });
  }

  return {
    category,
    personalizedRiskScore: riskScore,
    riskLevel,
    verdictTitle,
    verdictSummary,
    maskAdvice,
    ventilationAdvice,
    optimalWindow,
    recommendations,
    pollutantAlerts,
  };
}

export function answerAssistantQuery(
  query: string,
  snapshot: AirQualitySnapshot,
  context: UserContext,
  decision: DecisionResult
): string {
  const q = query.trim().toLowerCase();
  if (!q) {
    return 'Ask me about running outdoors, mask usage, opening windows, or the cleanest time today.';
  }

  if (q.includes('window') || q.includes('ventilat') || q.includes('indoor') || q.includes('purifier')) {
    return `${decision.ventilationAdvice} Current AQI in ${snapshot.city.name} is ${snapshot.aqi} (${decision.category.label}), with PM2.5 at ${snapshot.pollutants.pm25.toFixed(1)} µg/m³.`;
  }

  if (q.includes('mask') || q.includes('n95') || q.includes('respirator')) {
    return `${decision.maskAdvice} Dominant pollutant right now is ${snapshot.dominantPollutant.toUpperCase()}.`;
  }

  if (q.includes('when') || q.includes('best time') || q.includes('window') || q.includes('forecast') || q.includes('cleanest')) {
    if (decision.optimalWindow) {
      const start = new Date(decision.optimalWindow.startTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      if (decision.optimalWindow.isCurrentBest) {
        return `Right now is already near the cleanest air window for ${snapshot.city.name} (projected AQI ~${decision.optimalWindow.avgAqi}).`;
      }
      return `The cleanest upcoming window in ${snapshot.city.name} starts around ${start}, with AQI dropping to ~${decision.optimalWindow.avgAqi} (${decision.optimalWindow.improvementPercent}% cleaner than now).`;
    }
  }

  if (q.includes('run') || q.includes('jog') || q.includes('workout') || q.includes('exercise') || q.includes('walk') || q.includes('safe')) {
    return `${decision.verdictTitle} (Personal Risk Score: ${decision.personalizedRiskScore}/100). ${decision.verdictSummary}`;
  }

  if (q.includes('pollutant') || q.includes('pm2.5') || q.includes('pm25') || q.includes('ozone') || q.includes('o3') || q.includes('no2')) {
    const p = snapshot.pollutants;
    return `Current breakdown for ${snapshot.city.name}: PM2.5 ${p.pm25.toFixed(1)} µg/m³, PM10 ${p.pm10.toFixed(1)} µg/m³, O₃ ${p.o3.toFixed(0)} µg/m³, NO₂ ${p.no2.toFixed(1)} µg/m³. Primary driver: ${snapshot.dominantPollutant.toUpperCase()}.`;
  }

  return `In ${snapshot.city.name}, AQI is ${snapshot.aqi} (${decision.category.label}) and your personalized risk score is ${decision.personalizedRiskScore}/100 (${PERSONA_META[context.persona].label}). ${decision.verdictSummary}`;
}
