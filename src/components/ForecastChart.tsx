import { Clock, Sparkles } from 'lucide-react';
import { classifyAqi } from '../engine/decisionEngine';
import type { HourlyForecastPoint, OptimalWindow } from '../types/airQuality';

interface ForecastChartProps {
  hourly: HourlyForecastPoint[];
  optimalWindow: OptimalWindow | null;
}

export function ForecastChart({ hourly, optimalWindow }: ForecastChartProps) {
  // Sample 12 evenly spaced points across the next 24h for clean responsive display
  const sampled = hourly.filter((_, idx) => idx % 2 === 0).slice(0, 12);
  const maxAqi = Math.max(100, ...sampled.map((p) => p.aqi));

  const bestStartMs = optimalWindow ? new Date(optimalWindow.startTime).getTime() : -1;
  const bestEndMs = optimalWindow ? new Date(optimalWindow.endTime).getTime() : -1;

  return (
    <section className="card" aria-labelledby="forecast-heading">
      <div className="card-header">
        <h2 id="forecast-heading" className="card-title">
          <Clock size={18} aria-hidden="true" color="var(--accent-primary)" />
          24-Hour AQI Outlook
        </h2>
      </div>

      <div className="forecast-bars" role="list" aria-label="Hourly AQI forecast">
        {sampled.map((point) => {
          const cat = classifyAqi(point.aqi);
          const heightPct = Math.max(12, Math.round((point.aqi / maxAqi) * 100));
          const tMs = new Date(point.time).getTime();
          const isBest = tMs >= bestStartMs && tMs < bestEndMs;
          const timeLabel = new Date(point.time).toLocaleTimeString([], { hour: '2-digit' });

          return (
            <div
              key={point.time}
              className="forecast-col"
              role="listitem"
              title={`${timeLabel}: AQI ${point.aqi} (${cat.label})`}
            >
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {point.aqi}
              </span>
              <div
                className={`forecast-bar ${isBest ? 'best-window' : ''}`}
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: cat.colorVar,
                }}
              />
              <span className="forecast-time">{timeLabel}</span>
            </div>
          );
        })}
      </div>

      {optimalWindow && (
        <div className="optimal-banner" role="status">
          <Sparkles size={18} color="var(--accent-primary)" aria-hidden="true" style={{ flexShrink: 0 }} />
          <div>
            <strong>Optimal Clean Window: </strong>
            {optimalWindow.isCurrentBest ? (
              <span>Right now is among the cleanest hours (avg AQI ~{optimalWindow.avgAqi}).</span>
            ) : (
              <span>
                {new Date(optimalWindow.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                –{' '}
                {new Date(optimalWindow.endTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                (avg AQI ~{optimalWindow.avgAqi}, {optimalWindow.improvementPercent}% cleaner).
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
