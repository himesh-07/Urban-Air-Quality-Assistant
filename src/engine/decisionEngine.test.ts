import { describe, expect, it } from 'vitest';
import { FALLBACK_SNAPSHOTS } from '../data/presets';
import {
  answerAssistantQuery,
  classifyAqi,
  computePersonalizedRiskScore,
  evaluateAirQualityDecision,
  findOptimalWindow,
  getDominantPollutant,
} from './decisionEngine';
import type { UserContext } from '../types/airQuality';

describe('decisionEngine', () => {
  it('classifies US AQI thresholds accurately', () => {
    expect(classifyAqi(25).key).toBe('good');
    expect(classifyAqi(75).key).toBe('moderate');
    expect(classifyAqi(125).key).toBe('sensitive');
    expect(classifyAqi(175).key).toBe('unhealthy');
    expect(classifyAqi(250).key).toBe('very_unhealthy');
    expect(classifyAqi(350).key).toBe('hazardous');
  });

  it('increases risk score for sensitive personas and vigorous outdoor exertion', () => {
    const baseContext: UserContext = {
      persona: 'general',
      activity: 'light_walk',
      durationMinutes: 30,
      environment: 'outdoor',
    };
    const sensitiveContext: UserContext = {
      persona: 'asthma_respiratory',
      activity: 'vigorous_workout',
      durationMinutes: 120,
      environment: 'outdoor',
    };

    const baseScore = computePersonalizedRiskScore(110, baseContext);
    const sensitiveScore = computePersonalizedRiskScore(110, sensitiveContext);
    expect(sensitiveScore).toBeGreaterThan(baseScore);
  });

  it('reduces risk score when indoors with HEPA filtration', () => {
    const outdoor: UserContext = {
      persona: 'general',
      activity: 'moderate_exercise',
      durationMinutes: 60,
      environment: 'outdoor',
    };
    const filtered: UserContext = { ...outdoor, environment: 'indoor_filtered' };

    expect(computePersonalizedRiskScore(160, filtered)).toBeLessThan(
      computePersonalizedRiskScore(160, outdoor)
    );
  });

  it('identifies dominant pollutant relative to WHO guidelines', () => {
    expect(
      getDominantPollutant({ pm25: 90, pm10: 50, o3: 40, no2: 15, so2: 5, co: 300 })
    ).toBe('pm25');
    expect(
      getDominantPollutant({ pm25: 5, pm10: 10, o3: 180, no2: 10, so2: 2, co: 200 })
    ).toBe('o3');
  });

  it('finds the cleanest forecast window', () => {
    const forecast = [
      { time: '2026-11-25T08:00:00.000Z', aqi: 140, pm25: 50, o3: 60 },
      { time: '2026-11-25T09:00:00.000Z', aqi: 120, pm25: 42, o3: 62 },
      { time: '2026-11-25T10:00:00.000Z', aqi: 55, pm25: 14, o3: 55 },
      { time: '2026-11-25T11:00:00.000Z', aqi: 60, pm25: 16, o3: 58 },
    ];
    const win = findOptimalWindow(forecast, 140, 60);
    expect(win).not.toBeNull();
    expect(win?.avgAqi).toBe(55);
    expect(win?.improvementPercent).toBeGreaterThan(50);
  });

  it('generates mask and sensitivity recommendations for unhealthy air', () => {
    const delhi = FALLBACK_SNAPSHOTS['new-delhi'];
    const result = evaluateAirQualityDecision(delhi, {
      persona: 'asthma_respiratory',
      activity: 'moderate_exercise',
      durationMinutes: 60,
      environment: 'outdoor',
    });

    expect(result.riskLevel === 'high' || result.riskLevel === 'critical').toBe(true);
    expect(result.maskAdvice).toContain('N95');
    expect(result.recommendations.some((r) => r.id === 'health-precaution')).toBe(true);
  });

  it('answers natural language assistant questions contextually', () => {
    const london = FALLBACK_SNAPSHOTS['london'];
    const ctx: UserContext = {
      persona: 'general',
      activity: 'light_walk',
      durationMinutes: 30,
      environment: 'outdoor',
    };
    const decision = evaluateAirQualityDecision(london, ctx);
    const reply = answerAssistantQuery('Should I wear an N95 mask?', london, ctx, decision);
    expect(reply.length).toBeGreaterThan(20);
    expect(reply).toContain(london.dominantPollutant.toUpperCase());
  });
});
