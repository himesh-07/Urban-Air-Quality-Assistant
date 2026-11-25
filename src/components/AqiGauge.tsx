import type { AqiCategory } from '../types/airQuality';

interface AqiGaugeProps {
  aqi: number;
  category: AqiCategory;
}

export function AqiGauge({ aqi, category }: AqiGaugeProps) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(300, Math.max(0, aqi));
  const progress = clamped / 300;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="gauge-container" role="img" aria-label={`US AQI ${aqi}, ${category.label}`}>
      <svg className="gauge-svg" viewBox="0 0 172 172">
        <circle
          cx="86"
          cy="86"
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="12"
        />
        <circle
          cx="86"
          cy="86"
          r={radius}
          fill="none"
          stroke={category.colorVar}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 86 86)"
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="gauge-center">
        <span className="gauge-value" style={{ color: category.colorVar }}>
          {aqi}
        </span>
        <span className="gauge-unit">US AQI</span>
      </div>
    </div>
  );
}
