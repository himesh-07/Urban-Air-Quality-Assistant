import { Activity } from 'lucide-react';
import type { PollutantMetrics } from '../types/airQuality';

interface PollutantGridProps {
  pollutants: PollutantMetrics;
  dominant: keyof PollutantMetrics;
}

const POLLUTANT_CONFIG: Array<{
  key: keyof PollutantMetrics;
  label: string;
  unit: string;
  whoLimit: number;
}> = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', whoLimit: 15 },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³', whoLimit: 45 },
  { key: 'o3', label: 'Ozone (O₃)', unit: 'µg/m³', whoLimit: 100 },
  { key: 'no2', label: 'NO₂', unit: 'µg/m³', whoLimit: 25 },
  { key: 'so2', label: 'SO₂', unit: 'µg/m³', whoLimit: 40 },
  { key: 'co', label: 'CO', unit: 'µg/m³', whoLimit: 4000 },
];

export function PollutantGrid({ pollutants, dominant }: PollutantGridProps) {
  return (
    <section className="card" aria-labelledby="pollutants-heading">
      <div className="card-header">
        <h2 id="pollutants-heading" className="card-title">
          <Activity size={18} aria-hidden="true" color="var(--accent-primary)" />
          Live Pollutant Breakdown
        </h2>
      </div>

      <div className="pollutant-grid">
        {POLLUTANT_CONFIG.map((item) => {
          const val = pollutants[item.key];
          const isDom = dominant === item.key;
          const ratio = Math.min(100, Math.round((val / (item.whoLimit * 2)) * 100));
          const barColor =
            val > item.whoLimit * 1.5
              ? 'var(--aqi-unhealthy)'
              : val > item.whoLimit
              ? 'var(--aqi-moderate)'
              : 'var(--aqi-good)';

          return (
            <div key={item.key} className="pollutant-card">
              <div className="pollutant-top">
                <span>{item.label}</span>
                {isDom && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '999px',
                      background: 'var(--accent-soft)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    Primary
                  </span>
                )}
              </div>
              <div className="pollutant-val">
                {item.key === 'co' ? val.toFixed(0) : val.toFixed(1)}{' '}
                <span className="pollutant-unit">{item.unit}</span>
              </div>
              <div className="risk-bar-track" style={{ height: '5px' }}>
                <div
                  className="risk-bar-fill"
                  style={{ width: `${Math.max(8, ratio)}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
